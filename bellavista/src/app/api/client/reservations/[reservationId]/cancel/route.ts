// src/app/api/client/reservations/[reservationId]/cancel/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  ReservationStatus as PrismaReservationStatus,
  NotificationType,
} from "@prisma/client"; // Added NotificationType

interface RouteContext {
  params: {
    reservationId: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params;

  if (!token || !token.id || token.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;

  console.log(
    `API_RESERVATION_CANCEL_POST: User ${userId} attempting to cancel Res ID: ${reservationId}`
  );

  try {
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        clientId: userId,
      },
      // Include room name for the notification message
      include: {
        rooms: {
          select: { name: true },
          take: 1, // Assuming one primary room name is sufficient for notification
        },
      },
    });

    if (!reservation) {
      console.log(
        `API_RESERVATION_CANCEL_POST: Reservation ${reservationId} not found for user ${userId}.`
      );
      return NextResponse.json(
        { message: "Reservation not found or access denied." },
        { status: 404 }
      );
    }

    const now = new Date();
    const isCancellableServerSide =
      (reservation.status === PrismaReservationStatus.CONFIRMED ||
        reservation.status === PrismaReservationStatus.PENDING) &&
      reservation.checkIn > now &&
      (reservation.checkIn.getTime() - now.getTime()) / (1000 * 3600 * 24) > 7;

    if (!isCancellableServerSide) {
      console.log(
        `API_RESERVATION_CANCEL_POST: Reservation ${reservationId} cannot be cancelled based on server policy.`
      );
      return NextResponse.json(
        {
          message:
            "This reservation cannot be cancelled at this time according to policy.",
        },
        { status: 403 }
      );
    }

    // Use a transaction to update reservation and create notification atomically
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: PrismaReservationStatus.CANCELED,
          updatedAt: new Date(),
        },
      });
      console.log(
        `API_RESERVATION_CANCEL_POST: Reservation ${reservationId} status set to CANCELED.`
      );

      // --- Create Notification for successful cancellation ---
      const hotelNameForNotification =
        reservation.rooms.length > 0
          ? reservation.rooms[0].name
          : "your recent booking";
      const checkInDateFormatted = reservation.checkIn.toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      );

      await tx.notification.create({
        data: {
          userId: userId,
          type: NotificationType.UPDATE, // Or a more specific CANCELLATION type if you add it
          title: "Reservation Cancelled",
          message: `Your reservation for ${hotelNameForNotification} checking in on ${checkInDateFormatted} has been successfully cancelled.`,
          sender: "Bellavista Reservations",
          // link: `/client/history?reservationId=${reservationId}` // Optional: link back to the cancelled reservation
        },
      });
      console.log(
        `API_RESERVATION_CANCEL_POST: Notification created for cancellation of reservation ${reservationId}.`
      );
    });

    // TODO: Implement refund logic based on cancellation policy and payment status.
    // TODO: Send cancellation confirmation email to the client.

    return NextResponse.json({
      message: "Reservation cancelled successfully.",
    });
  } catch (error: any) {
    console.error(
      `API_RESERVATION_CANCEL_POST_ERROR (ID: ${reservationId}):`,
      error
    );
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error cancelling reservation", detail: error.message },
      { status: 500 }
    );
  }
}
