// src/app/api/admin/reservations/[reservationId]/validate/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { ReservationStatus, Role, NotificationType } from "@prisma/client";

interface RouteContext {
  params: {
    reservationId: string;
  };
}

interface ValidateActionBody {
  action: "confirm" | "reject";
  rejectionReason?: string; // Optional, only if action is 'reject'
}

export async function POST(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params;

  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const adminUserId = token.id as string; // ID of the admin performing the action

  try {
    const body = (await request.json()) as ValidateActionBody;
    const { action, rejectionReason } = body;

    if (
      !reservationId ||
      !action ||
      (action === "reject" && !rejectionReason)
    ) {
      return NextResponse.json(
        {
          message:
            "Missing reservationId, action, or rejection reason for rejection.",
        },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        client: { select: { id: true, name: true } },
        rooms: { select: { name: true }, take: 1 },
      }, // For notification
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found." },
        { status: 404 }
      );
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      return NextResponse.json(
        {
          message: `Reservation is not PENDING (current status: ${reservation.status}). Cannot validate.`,
        },
        { status: 409 }
      ); // Conflict
    }

    let updatedStatus: ReservationStatus;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === "confirm") {
      updatedStatus = ReservationStatus.CONFIRMED;
      notificationTitle = "Reservation Confirmed!";
      const hotelName =
        reservation.rooms.length > 0
          ? reservation.rooms[0].name.split("-")[0].trim()
          : "your booking";
      notificationMessage = `Great news, ${
        reservation.client.name
      }! Your reservation for ${hotelName} (Ref: ${reservation.id.substring(
        0,
        8
      )}) has been confirmed. We look forward to welcoming you.`;
      // TODO: Potentially trigger payment capture here if payment was only authorized.
      // TODO: Update room availability/inventory system.
    } else if (action === "reject") {
      updatedStatus = ReservationStatus.CANCELED; // Or a specific REJECTED status if you add one
      notificationTitle = "Reservation Update";
      notificationMessage = `Dear ${
        reservation.client.name
      }, regarding your reservation (Ref: ${reservation.id.substring(
        0,
        8
      )}), we regret to inform you that it could not be confirmed at this time. Reason: ${rejectionReason}. Any pre-authorized amount will be voided, and if any payment was processed, it will be refunded shortly. Please contact us for alternatives.`;
      // TODO: Trigger refund process if any pre-payment/hold was made.
    } else {
      return NextResponse.json(
        { message: "Invalid action specified." },
        { status: 400 }
      );
    }

    // Use a transaction to update reservation and create notification
    const [updatedReservation, newNotification] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data: {
          status: updatedStatus,
          updatedAt: new Date(),
          // You might add a field like 'processedByAdminId: adminUserId'
        },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.clientId,
          type:
            action === "confirm"
              ? NotificationType.BOOKING
              : NotificationType.ALERT,
          title: notificationTitle,
          message: notificationMessage,
          sender: "Bellavista Admin",
          link: `/client/history?reservationId=${reservation.id}`, // Link to reservation details
        },
      }),
    ]);

    console.log(
      `ADMIN_VALIDATE_RESERVATION: Reservation ${reservationId} status updated to ${updatedStatus} by admin ${adminUserId}. Notification created.`
    );
    return NextResponse.json({
      message: `Reservation ${
        action === "confirm" ? "confirmed" : "rejected"
      } successfully.`,
      reservation: updatedReservation,
    });
  } catch (error: any) {
    console.error(
      `API_ADMIN_VALIDATE_RESERVATION_ERROR (Res ID: ${reservationId}):`,
      error
    );
    return NextResponse.json(
      {
        message: "Error processing reservation validation",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
