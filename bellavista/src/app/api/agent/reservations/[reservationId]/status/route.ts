// src/app/api/agent/reservations/[reservationId]/status/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, ReservationStatus, NotificationType } from "@prisma/client";

interface RouteContext {
  params: {
    reservationId: string;
  };
}

interface UpdateStatusBody {
  newStatus: ReservationStatus.CHECKED_IN | ReservationStatus.CHECKED_OUT; // Agent can only perform these status changes
  // Optionally add roomNumber if agent is assigning a specific room at check-in
  // assignedRoomNumber?: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Using POST for status change action
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params;

  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const agentUserId = token.id as string;

  try {
    const body = (await request.json()) as UpdateStatusBody;
    const { newStatus } = body;

    if (
      !newStatus ||
      (newStatus !== ReservationStatus.CHECKED_IN &&
        newStatus !== ReservationStatus.CHECKED_OUT)
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid new status provided. Must be CHECKED_IN or CHECKED_OUT.",
        },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { client: { select: { name: true, id: true } } }, // For notification
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found." },
        { status: 404 }
      );
    }

    // Business logic for status change
    if (newStatus === ReservationStatus.CHECKED_IN) {
      if (reservation.status !== ReservationStatus.CONFIRMED) {
        return NextResponse.json(
          { message: "Reservation must be CONFIRMED to be checked in." },
          { status: 400 }
        );
      }
      // Optional: Check if check-in date is today or reasonably close
    } else if (newStatus === ReservationStatus.CHECKED_OUT) {
      if (reservation.status !== ReservationStatus.CHECKED_IN) {
        return NextResponse.json(
          { message: "Reservation must be CHECKED_IN to be checked out." },
          { status: 400 }
        );
      }
      // Optional: Check if check-out date is today or reasonably close
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        // If assigning a specific room at check-in and your schema supports it:
        // ...(newStatus === ReservationStatus.CHECKED_IN && body.assignedRoomNumber && {
        //     rooms: { connect: { roomNumber: body.assignedRoomNumber } } // This assumes you can connect by roomNumber
        // })
      },
    });

    // Create notification for the client
    let notificationTitle = "";
    let notificationMessage = "";
    if (newStatus === ReservationStatus.CHECKED_IN) {
      notificationTitle = "Checked In Successfully!";
      notificationMessage = `Welcome, ${
        reservation.client.name
      }! You have successfully checked in for reservation #${reservation.id.substring(
        0,
        8
      )}. Enjoy your stay!`;
    } else if (newStatus === ReservationStatus.CHECKED_OUT) {
      notificationTitle = "Checked Out Successfully";
      notificationMessage = `Thank you for staying with us, ${
        reservation.client.name
      } (Reservation #${reservation.id.substring(
        0,
        8
      )}). We hope you had a pleasant stay!`;
      // TODO: Trigger invoice generation/sending here if applicable
    }

    if (notificationTitle && reservation.client.id) {
      await prisma.notification.create({
        data: {
          userId: reservation.client.id,
          type: NotificationType.UPDATE, // Or BOOKING
          title: notificationTitle,
          message: notificationMessage,
          sender: "Hotel Reception",
          link: `/client/history?reservationId=${reservation.id}`,
        },
      });
    }

    return NextResponse.json({
      message: `Reservation status updated to ${newStatus}.`,
      reservation: updatedReservation,
    });
  } catch (error: any) {
    console.error(
      `API_AGENT_RESERVATION_STATUS_UPDATE_ERROR (ID: ${reservationId}):`,
      error
    );
    return NextResponse.json(
      { message: "Error updating reservation status", detail: error.message },
      { status: 500 }
    );
  }
}
