// src/app/api/agent/dashboard-summary/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, ReservationStatus } from "@prisma/client";

export interface AgentDashboardSummaryResponse {
  upcomingCheckInsToday: number;
  upcomingCheckOutsToday: number;
  systemPendingReservations: number; // All PENDING in the system
  bookingsByThisAgentToday: number;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== Role.AGENT) {
    return NextResponse.json(
      { message: "Unauthorized: Agent role required." },
      { status: 401 }
    );
  }
  const agentUserId = token.id as string;
  console.log(
    `API_AGENT_DASHBOARD_SUMMARY: Authorized Agent ID: ${agentUserId}`
  );

  try {
    const now = new Date();
    const todayStart = new Date(now); // Create a new Date object
    todayStart.setUTCHours(0, 0, 0, 0); // Start of today UTC

    const todayEnd = new Date(now); // Create a new Date object
    todayEnd.setUTCHours(23, 59, 59, 999); // End of today UTC

    console.log(
      `API_AGENT_DASHBOARD_SUMMARY: Today's range (UTC): ${todayStart.toISOString()} - ${todayEnd.toISOString()}`
    );

    // 1. Upcoming Check-ins for Today (Confirmed reservations checking in today)
    const upcomingCheckInsToday = await prisma.reservation.count({
      where: {
        status: ReservationStatus.CONFIRMED,
        checkIn: {
          // CheckIn is DateTime, compare full range
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    console.log(
      "API_AGENT_DASHBOARD_SUMMARY: Upcoming CheckIns Today:",
      upcomingCheckInsToday
    );

    // 2. Upcoming Check-outs for Today (Currently CHECKED_IN guests checking out today)
    const upcomingCheckOutsToday = await prisma.reservation.count({
      where: {
        status: ReservationStatus.CHECKED_IN,
        checkOut: {
          // CheckOut is DateTime
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    console.log(
      "API_AGENT_DASHBOARD_SUMMARY: Upcoming CheckOuts Today:",
      upcomingCheckOutsToday
    );

    // 3. Total PENDING reservations in the system (system-wide, not specific to agent actions unless defined)
    const systemPendingReservations = await prisma.reservation.count({
      where: {
        status: ReservationStatus.PENDING,
      },
    });
    console.log(
      "API_AGENT_DASHBOARD_SUMMARY: System Pending Reservations:",
      systemPendingReservations
    );

    // 4. Bookings made by THIS agent today
    // This requires `createdByAgentId` field on Reservation model.
    let bookingsByThisAgentToday = 0;
    try {
      // Test if the field exists by trying to select it on a known record or a dummy query
      // This is a bit of a hacky way to check schema presence in runtime without direct schema introspection
      // A more robust way is to ensure your deployment always has the latest schema.
      const testReservationWithAgentField = await prisma.reservation.findFirst({
        select: { createdByAgentId: true }, // Just to see if the field is queryable
      });

      if (testReservationWithAgentField !== undefined) {
        // Field exists in schema
        bookingsByThisAgentToday = await prisma.reservation.count({
          where: {
            createdByAgentId: agentUserId,
            createdAt: {
              // When the booking was made
              gte: todayStart,
              lte: todayEnd,
            },
            // Optionally exclude cancelled ones made today
            // status: { not: ReservationStatus.CANCELED }
          },
        });
        console.log(
          "API_AGENT_DASHBOARD_SUMMARY: Bookings By This Agent Today:",
          bookingsByThisAgentToday
        );
      } else {
        console.warn(
          "API_AGENT_DASHBOARD_SUMMARY: `createdByAgentId` field might be missing from Reservation model schema. 'Bookings by Agent Today' will be 0."
        );
      }
    } catch (e: any) {
      // Catch potential error if field truly doesn't exist for Prisma client
      if (
        e.message &&
        (e.message.includes("Unknown arg") ||
          e.message.includes("Invalid `prisma.reservation.count()`"))
      ) {
        console.warn(
          "API_AGENT_DASHBOARD_SUMMARY: Error querying `createdByAgentId` (likely missing from schema). 'Bookings by Agent Today' set to 0.",
          e.code
        );
      } else {
        throw e; // Re-throw other errors
      }
    }

    const summary: AgentDashboardSummaryResponse = {
      upcomingCheckInsToday,
      upcomingCheckOutsToday,
      systemPendingReservations, // Renamed for clarity
      bookingsByThisAgentToday,
    };
    console.log("API_AGENT_DASHBOARD_SUMMARY: Returning summary:", summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("API_AGENT_DASHBOARD_SUMMARY_ERROR:", error);
    return NextResponse.json(
      {
        message: "Error fetching agent dashboard summary",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
