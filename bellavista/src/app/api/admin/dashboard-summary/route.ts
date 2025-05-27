// src/app/api/admin/dashboard-summary/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, ReservationStatus, ActivityType } from "@prisma/client"; // Assuming ActivityType exists

// Define ActivityType in your Prisma schema if it doesn't exist
// enum ActivityType {
//   NEW_BOOKING
//   CANCELLATION
//   CHECK_IN
//   CHECK_OUT
//   NEW_FEEDBACK
//   USER_REGISTERED
// }
// model ActivityLog { // You'd need a model to store activities
//   id String @id @default(cuid())
//   type ActivityType
//   description String
//   timestamp DateTime @default(now())
//   userId String? // User who performed action OR user action is about
//   user User? @relation(fields: [userId], references: [id])
//   link String?
//   relatedResourceId String? // e.g., reservationId, userId
// }

export interface DashboardSummaryResponse {
  pendingReservationsCount: number;
  upcomingCheckInsToday: number;
  upcomingCheckOutsToday: number;
  currentOccupancyRate?: number;
  totalActiveReservations: number;
  recentActivities: {
    id: string;
    type: string; // Map enum to string
    description: string;
    timestamp: string;
    link?: string;
    userName?: string;
  }[];
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const pendingReservationsCount = await prisma.reservation.count({
      where: { status: ReservationStatus.PENDING },
    });

    const upcomingCheckInsToday = await prisma.reservation.count({
      where: {
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING],
        },
        checkIn: { gte: todayStart, lte: todayEnd },
      },
    });

    const upcomingCheckOutsToday = await prisma.reservation.count({
      where: {
        status: ReservationStatus.CHECKED_IN, // Only those currently checked in
        checkOut: { gte: todayStart, lte: todayEnd },
      },
    });

    const totalActiveReservations = await prisma.reservation.count({
      where: {
        status: {
          in: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.PENDING,
            ReservationStatus.CHECKED_IN,
          ],
        },
      },
    });

    // Occupancy Rate (Simplified: active reservations / total rooms)
    // A more accurate calculation would consider room nights available vs. room nights booked for a period.
    const totalRooms = await prisma.room.count();
    const currentOccupancyRate =
      totalRooms > 0 ? (totalActiveReservations / totalRooms) * 100 : 0;

    // Mock recent activities - In a real app, you'd query an ActivityLog table
    const recentActivitiesRaw = await prisma.notification.findMany({
      // Using notifications as a proxy for activity
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    });
    const recentActivities = recentActivitiesRaw.map((act) => ({
      id: act.id,
      type: act.type.toString() as any, // Cast for now, map properly
      description: act.message,
      timestamp: act.createdAt.toISOString(),
      link: act.link || undefined,
      userName: act.user.name || undefined,
    }));

    const summary: DashboardSummaryResponse = {
      pendingReservationsCount,
      upcomingCheckInsToday,
      upcomingCheckOutsToday,
      currentOccupancyRate: parseFloat(currentOccupancyRate.toFixed(1)), // One decimal place
      totalActiveReservations,
      recentActivities,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("API_ADMIN_DASHBOARD_SUMMARY_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching dashboard summary", detail: error.message },
      { status: 500 }
    );
  }
}
