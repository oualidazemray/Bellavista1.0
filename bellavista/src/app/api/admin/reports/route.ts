// src/app/api/admin/reports/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  ReservationStatus,
  RoomType as PrismaRoomType,
} from "@prisma/client";

// --- Interfaces for API Response Data Structures ---
export interface BookingStatsSummary {
  totalReservations: number;
  totalRevenue: number;
  averageBookingValue: number;
  uniqueClients: number;
  reservationsThisMonth: number;
  revenueThisMonth: number;
  totalFeedbacks: number;
  averageFeedbackRating?: number | null;
}

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM format
  value: number; // Can be revenue or count
}
export interface TimeSeriesReport {
  data: TimeSeriesDataPoint[];
  totalValueInPeriod: number; // Sum of values in the 'data' array for the period
}

export interface RoomTypeDistributionDataPoint {
  name: string; // Room type name (e.g., "SUITE", "DOUBLE")
  value: number; // Number of bookings for this room type
}

// --- Main GET Handler ---
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json(
      { message: "Unauthorized: Admin role required." },
      { status: 401 }
    );
  }
  console.log("API_ADMIN_REPORTS: Authorized Admin Access");

  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type");
  const startDateParam = searchParams.get("startDate"); // Expected as ISO string
  const endDateParam = searchParams.get("endDate"); // Expected as ISO string

  try {
    // --- Report Type: bookingSummary ---
    if (reportType === "bookingSummary") {
      console.log("API_ADMIN_REPORTS: Generating bookingSummary report.");
      const now = new Date();
      const firstDayCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      const lastDayCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const activeReservationClause = {
        status: {
          notIn: [ReservationStatus.CANCELED, ReservationStatus.PENDING],
        },
      };

      const [
        totalReservationsCount,
        totalRevenueAggregation,
        uniqueClientsWithActiveReservations,
        reservationsThisMonthCount,
        revenueThisMonthAggregation,
        totalFeedbacksCount,
        feedbackRatingAggregation,
      ] = await prisma.$transaction([
        prisma.reservation.count({ where: activeReservationClause }),
        prisma.reservation.aggregate({
          _sum: { totalPrice: true },
          where: activeReservationClause,
        }),
        prisma.user.count({
          where: {
            role: Role.CLIENT,
            reservations: { some: activeReservationClause },
          },
        }),
        prisma.reservation.count({
          where: {
            ...activeReservationClause,
            createdAt: { gte: firstDayCurrentMonth, lte: lastDayCurrentMonth },
          },
        }),
        prisma.reservation.aggregate({
          _sum: { totalPrice: true },
          where: {
            ...activeReservationClause,
            createdAt: { gte: firstDayCurrentMonth, lte: lastDayCurrentMonth },
          },
        }),
        prisma.feedback.count(),
        prisma.feedback.aggregate({ _avg: { rating: true } }),
      ]);

      const totalRevenue = totalRevenueAggregation._sum.totalPrice || 0;
      const revenueThisMonth = revenueThisMonthAggregation._sum.totalPrice || 0;

      const summary: BookingStatsSummary = {
        totalReservations: totalReservationsCount,
        totalRevenue: totalRevenue,
        averageBookingValue:
          totalReservationsCount > 0
            ? totalRevenue / totalReservationsCount
            : 0,
        uniqueClients: uniqueClientsWithActiveReservations,
        reservationsThisMonth: reservationsThisMonthCount,
        revenueThisMonth: revenueThisMonth,
        totalFeedbacks: totalFeedbacksCount,
        averageFeedbackRating: feedbackRatingAggregation._avg.rating,
      };
      console.log("API_ADMIN_REPORTS: bookingSummary generated:", summary);
      return NextResponse.json(summary);
    }
    // --- Report Type: revenueOverTime or bookingsOverTime ---
    else if (
      reportType === "revenueOverTime" ||
      reportType === "bookingsOverTime"
    ) {
      console.log(`API_ADMIN_REPORTS: Generating ${reportType} report.`);
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      // Default to last 12 months (current month + 11 previous full months)
      const startDate = startDateParam
        ? new Date(startDateParam)
        : new Date(new Date(endDate).setMonth(endDate.getMonth() - 11));

      startDate.setDate(1); // Start from the beginning of the start month
      startDate.setUTCHours(0, 0, 0, 0); // Normalize to start of the day UTC

      // To include the whole end day for lte comparison:
      const effectiveEndDate = new Date(endDate);
      effectiveEndDate.setUTCHours(23, 59, 59, 999); // Normalize to end of the day UTC

      console.log(
        `API_ADMIN_REPORTS: Date range for ${reportType}: ${startDate.toISOString()} to ${effectiveEndDate.toISOString()}`
      );

      const dataFieldToAggregate =
        reportType === "revenueOverTime" ? "_sum" : "_count";
      const valueFieldForAggregation =
        reportType === "revenueOverTime" ? "totalPrice" : "id";

      const rawTimeSeriesData = await prisma.reservation.groupBy({
        by: ["createdAt"], // Group by the full timestamp first
        [dataFieldToAggregate]: { [valueFieldForAggregation]: true } as any,
        where: {
          status: {
            notIn: [ReservationStatus.CANCELED, ReservationStatus.PENDING],
          },
          createdAt: { gte: startDate, lte: effectiveEndDate },
        },
        orderBy: { createdAt: "asc" },
      });

      const monthlyAggregatedData: { [key: string]: number } = {};
      rawTimeSeriesData.forEach((item: any) => {
        const dateObj = new Date(item.createdAt); // createdAt is already a Date object from Prisma
        const monthYear = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        const value =
          reportType === "revenueOverTime"
            ? item._sum?.totalPrice || 0
            : item._count?.id || 0;
        monthlyAggregatedData[monthYear] =
          (monthlyAggregatedData[monthYear] || 0) + value;
      });

      const reportDataPoints: TimeSeriesDataPoint[] = Object.entries(
        monthlyAggregatedData
      )
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Ensure chronological order by YYYY-MM string

      const totalValueInPeriod = reportDataPoints.reduce(
        (sum, item) => sum + item.value,
        0
      );
      const reportResponse: TimeSeriesReport = {
        data: reportDataPoints,
        totalValueInPeriod,
      };

      console.log(
        `API_ADMIN_REPORTS: ${reportType} generated. Points: ${reportDataPoints.length}, Total: ${totalValueInPeriod}`
      );
      return NextResponse.json(reportResponse);
    }
    // --- Report Type: roomTypeDistribution ---
    else if (reportType === "roomTypeDistribution") {
      console.log("API_ADMIN_REPORTS: Generating roomTypeDistribution report.");
      const allRoomTypesEnum = Object.values(PrismaRoomType); // e.g., ["SIMPLE", "DOUBLE", "SUITE"]
      const roomTypeDistribution: RoomTypeDistributionDataPoint[] = [];

      for (const roomType of allRoomTypesEnum) {
        const count = await prisma.reservation.count({
          where: {
            status: {
              notIn: [ReservationStatus.CANCELED, ReservationStatus.PENDING],
            },
            rooms: { some: { type: roomType } }, // Count reservations that include at least one room of this type
          },
        });
        if (count > 0) {
          roomTypeDistribution.push({
            name: PrismaRoomType[roomType],
            value: count,
          }); // Use string key of enum for name
        }
      }
      const sortedDistribution = roomTypeDistribution.sort(
        (a, b) => b.value - a.value
      ); // Sort by most popular
      console.log(
        "API_ADMIN_REPORTS: roomTypeDistribution generated:",
        sortedDistribution
      );
      return NextResponse.json(sortedDistribution); // Return array directly
    }
    // --- Invalid Report Type ---
    else {
      console.log(
        "API_ADMIN_REPORTS: Invalid report type specified:",
        reportType
      );
      return NextResponse.json(
        {
          message:
            "Invalid report type specified. Valid types are: bookingSummary, revenueOverTime, bookingsOverTime, roomTypeDistribution.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("API_ADMIN_REPORTS_GET_ERROR: Unhandled error:", error);
    return NextResponse.json(
      { message: "Error fetching report data", detail: error.message },
      { status: 500 }
    );
  }
}
