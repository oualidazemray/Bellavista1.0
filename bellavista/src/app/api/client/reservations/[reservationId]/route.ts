// src/app/api/client/reservations/[reservationId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  ReservationStatus as PrismaReservationStatus,
  Prisma,
  RoomType as PrismaRoomType,
} from "@prisma/client";

interface RouteContext {
  params: {
    reservationId: string;
  };
}

interface EditReservationRequestBody {
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

// --- GET Handler: Fetch details for a single reservation ---
// Used by Edit, Cancel, and Feedback pages to display reservation info.
export async function GET(request: NextRequest, context: RouteContext) {
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
    `API_RESERVATION_ID_GET: Fetching details for Res ID: ${reservationId}, User ID: ${userId}`
  );
  try {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, clientId: userId },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            type: true,
            imageUrl: true,
            pricePerNight: true,
            maxGuests: true,
            bedConfiguration: true,
            view: true,
            characteristics: true,
          },
        },
      },
    });

    if (!reservation) {
      console.log(
        `API_RESERVATION_ID_GET: Reservation ${reservationId} not found for user ${userId}.`
      );
      return NextResponse.json(
        { message: "Reservation details not found or access denied." },
        { status: 404 }
      );
    }

    const now = new Date();
    const isUpcoming =
      (reservation.status === PrismaReservationStatus.CONFIRMED ||
        reservation.status === PrismaReservationStatus.PENDING) &&
      reservation.checkIn > now;
    const daysUntilCheckIn = isUpcoming
      ? (reservation.checkIn.getTime() - now.getTime()) / (1000 * 3600 * 24)
      : 0;

    const canEditThisReservation =
      reservation.status === PrismaReservationStatus.CONFIRMED &&
      isUpcoming &&
      daysUntilCheckIn > 2;
    const canCancelThisReservation = isUpcoming && daysUntilCheckIn > 7; // Example: >7 days away

    const firstRoom =
      reservation.rooms.length > 0 ? reservation.rooms[0] : null;
    const reservationDetailsForFrontend = {
      id: reservation.id,
      hotelName: firstRoom?.name || "Hotel Bellavista",
      roomType: firstRoom?.type
        ? PrismaRoomType[firstRoom.type]
        : "Unknown Room",
      hotelImageUrl: firstRoom?.imageUrl,
      checkInDate: reservation.checkIn.toISOString().split("T")[0],
      checkOutDate: reservation.checkOut.toISOString().split("T")[0],
      numberOfGuests: reservation.numAdults + (reservation.numChildren || 0),
      totalPrice: reservation.totalPrice,
      status: reservation.status.toString(),
      cancellationPolicyDetails: `Example: Edit >2 days before check-in. Cancel >7 days before check-in.`, // This should be dynamic
      canEdit: canEditThisReservation,
      canCancel: canCancelThisReservation, // Send this flag to the frontend
      currentRoomsInfo: reservation.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: PrismaRoomType[r.type],
        maxGuests: r.maxGuests,
        pricePerNight: r.pricePerNight,
      })),
    };
    return NextResponse.json(reservationDetailsForFrontend);
  } catch (error: any) {
    console.error(
      `API_RESERVATION_ID_GET_ERROR (ID: ${reservationId}):`,
      error
    );
    return NextResponse.json(
      { message: "Error fetching reservation details", detail: error.message },
      { status: 500 }
    );
  }
}

// --- PUT Handler: Update an existing reservation (for Edit page submission) ---
// (This handler remains the same as the last complete version I provided for it)
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params;
  if (!token || !token.id || token.role !== "CLIENT")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = token.id as string;

  console.log(
    `API_RESERVATION_ID_PUT: Attempting update for Res ID: ${reservationId}, User ID: ${userId}`
  );
  try {
    const body = (await request.json()) as EditReservationRequestBody;
    const { checkInDate, checkOutDate, numberOfGuests } = body;

    if (
      !checkInDate ||
      !checkOutDate ||
      numberOfGuests === undefined ||
      numberOfGuests < 1
    ) {
      return NextResponse.json(
        {
          message:
            "Check-in date, check-out date, and number of guests are required.",
        },
        { status: 400 }
      );
    }
    const newCheckIn = new Date(checkInDate + "T12:00:00.000Z");
    const newCheckOut = new Date(checkOutDate + "T12:00:00.000Z");

    if (newCheckIn >= newCheckOut)
      return NextResponse.json(
        { message: "Check-out date must be after check-in date." },
        { status: 400 }
      );
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (newCheckIn < today)
      return NextResponse.json(
        { message: "Check-in date cannot be in the past." },
        { status: 400 }
      );

    const originalReservation = await prisma.reservation.findFirst({
      where: { id: reservationId, clientId: userId },
      include: {
        rooms: { select: { pricePerNight: true, maxGuests: true, id: true } },
      },
    });

    if (!originalReservation)
      return NextResponse.json(
        { message: "Reservation not found or access denied." },
        { status: 404 }
      );
    const now = new Date();
    const isServerEditable =
      originalReservation.status === PrismaReservationStatus.CONFIRMED &&
      originalReservation.checkIn > now &&
      (originalReservation.checkIn.getTime() - now.getTime()) /
        (1000 * 3600 * 24) >
        2;
    if (!isServerEditable)
      return NextResponse.json(
        { message: "This reservation cannot be edited (server policy)." },
        { status: 403 }
      );

    const totalMaxGuestsInReservation = originalReservation.rooms.reduce(
      (sum, room) => sum + (room.maxGuests || 0),
      0
    );
    if (numberOfGuests > totalMaxGuestsInReservation)
      return NextResponse.json(
        {
          message: `Guests (${numberOfGuests}) exceed capacity (${totalMaxGuestsInReservation}).`,
        },
        { status: 400 }
      );

    if (
      newCheckIn.getTime() !== originalReservation.checkIn.getTime() ||
      newCheckOut.getTime() !== originalReservation.checkOut.getTime()
    ) {
      const roomIds = originalReservation.rooms.map((r) => r.id);
      const conflicting = await prisma.reservation.count({
        where: {
          id: { not: reservationId },
          status: {
            in: [
              PrismaReservationStatus.CONFIRMED,
              PrismaReservationStatus.PENDING,
            ],
          },
          rooms: { some: { id: { in: roomIds } } },
          AND: [
            { checkIn: { lt: newCheckOut } },
            { checkOut: { gt: newCheckIn } },
          ],
        },
      });
      if (conflicting > 0)
        return NextResponse.json(
          { message: "Room(s) not available for new dates." },
          { status: 409 }
        );
    }

    const nights = Math.max(
      1,
      Math.ceil(
        (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 3600 * 24)
      )
    );
    const pricePerNightSum = originalReservation.rooms.reduce(
      (sum, room) => sum + (room.pricePerNight || 0),
      0
    );
    const newTotalPrice = pricePerNightSum * nights;

    const updatedResData = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        numAdults: numberOfGuests,
        numChildren: 0,
        totalPrice: newTotalPrice,
        updatedAt: new Date(),
      },
      include: {
        rooms: {
          select: { name: true, type: true, imageUrl: true, maxGuests: true },
        },
      },
    });
    const firstUpdatedRoom =
      updatedResData.rooms.length > 0 ? updatedResData.rooms[0] : null;
    const responseData = {
      id: updatedResData.id,
      hotelName: firstUpdatedRoom?.name || "Hotel Bellavista",
      roomType: firstUpdatedRoom?.type
        ? PrismaRoomType[firstUpdatedRoom.type]
        : "Unknown Room",
      hotelImageUrl: firstUpdatedRoom?.imageUrl,
      checkInDate: updatedResData.checkIn.toISOString().split("T")[0],
      checkOutDate: updatedResData.checkOut.toISOString().split("T")[0],
      numberOfGuests:
        updatedResData.numAdults + (updatedResData.numChildren || 0),
      totalPrice: updatedResData.totalPrice,
      status: updatedResData.status.toString(),
      canEdit: isServerEditable,
      canCancel:
        (updatedResData.status === PrismaReservationStatus.CONFIRMED ||
          updatedResData.status === PrismaReservationStatus.PENDING) &&
        updatedResData.checkIn > new Date() &&
        (updatedResData.checkIn.getTime() - new Date().getTime()) /
          (1000 * 3600 * 24) >
          7,
      currentRoomsInfo: updatedResData.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: PrismaRoomType[r.type],
        maxGuests: r.maxGuests,
        pricePerNight: r.pricePerNight,
      })),
    };
    return NextResponse.json({
      message: "Reservation updated successfully!",
      reservation: responseData,
    });
  } catch (error: any) {
    console.error(
      `API_RESERVATION_ID_PUT_ERROR (ID: ${reservationId}):`,
      error
    );
    return NextResponse.json(
      { message: "Error updating reservation", detail: error.message },
      { status: 500 }
    );
  }
}

// POST handler for cancelling a reservation was here, IT IS NOW MOVED to its own file.
// You can delete the POST handler from this file if it was only for cancellation.
