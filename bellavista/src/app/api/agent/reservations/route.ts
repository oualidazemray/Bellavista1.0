// src/app/api/agent/reservations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  ReservationStatus as PrismaReservationStatus,
  Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";

interface AgentCreateBookingBody {
  clientId?: string;
  newClientDetails?: { name: string; email: string; phone?: string };
  roomIds: string[];
  checkInDate: string; // Expecting full ISO string from client
  checkOutDate: string; // Expecting full ISO string
  numAdults: number;
  numChildren: number;
  totalPrice: number;
  source?: string;
  specialRequests?: string;
  promoCodeUsed: string;
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== Role.AGENT) {
    return NextResponse.json(
      { message: "Unauthorized: Agent role required" },
      { status: 401 }
    );
  }
  const agentUserId = token.id as string;

  try {
    const body = (await request.json()) as AgentCreateBookingBody;

    const {
      clientId: existingClientId,
      newClientDetails,
      roomIds,
      checkInDate: checkInDateString, // Use distinct names for incoming strings
      checkOutDate: checkOutDateString,
      numAdults,
      numChildren,
      totalPrice: clientCalculatedTotalPrice,
      source = "RECEPTION",
      specialRequests = null, // Default to null if not provided
      promoCodeUsed = null, // Default to null if not provided
    } = body;

    if (
      !roomIds ||
      roomIds.length === 0 ||
      !checkInDateString ||
      !checkOutDateString ||
      numAdults < 1
    ) {
      return NextResponse.json(
        { message: "Missing required booking details (rooms, dates, guests)." },
        { status: 400 }
      );
    }
    if (
      !existingClientId &&
      (!newClientDetails || !newClientDetails.email || !newClientDetails.name)
    ) {
      return NextResponse.json(
        {
          message:
            "Client information (existing ID or new client details) is required.",
        },
        { status: 400 }
      );
    }

    // Parse date strings into Date objects
    const checkIn = new Date(checkInDateString);
    const checkOut = new Date(checkOutDateString);

    if (
      isNaN(checkIn.getTime()) ||
      isNaN(checkOut.getTime()) ||
      checkIn.getTime() >= checkOut.getTime()
    ) {
      // Compare timestamps for accuracy

      return NextResponse.json(
        {
          message:
            "Invalid check-in or check-out dates. Check-out must be after check-in.",
        },
        { status: 400 }
      );
    }

    const todayUTCStart = new Date();
    todayUTCStart.setUTCHours(0, 0, 0, 0);

    // For comparing just the date part against today, normalize checkIn to its UTC start of day
    const checkInDatePartUTC = new Date(
      checkIn.getUTCFullYear(),
      checkIn.getUTCMonth(),
      checkIn.getUTCDate()
    );

    if (checkInDatePartUTC < todayUTCStart) {
      return NextResponse.json(
        { message: "Check-in date cannot be in the past." },
        { status: 400 }
      );
    }

    let finalClientId: string;
    // --- Handle Client: Find existing or Create new ---
    if (existingClientId) {
      const client = await prisma.user.findUnique({
        where: { id: existingClientId, role: Role.CLIENT },
      });
      if (!client)
        return NextResponse.json(
          {
            message: `Existing client with ID ${existingClientId} not found or is not a client.`,
          },
          { status: 404 }
        );
      finalClientId = client.id;
    } else if (newClientDetails) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: newClientDetails.email },
      });
      if (existingByEmail)
        return NextResponse.json(
          {
            message: `A user with email ${newClientDetails.email} already exists.`,
          },
          { status: 409 }
        );
      const tempPassword = `Bellavista!${Math.random().toString(36).slice(-8)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const newClient = await prisma.user.create({
        data: {
          email: newClientDetails.email,
          name: newClientDetails.name,
          phone: newClientDetails.phone,
          password: hashedPassword,
          role: Role.CLIENT,
          isEmailVerified: true,
          profile: { create: {} },
        },
        select: { id: true },
      });
      finalClientId = newClient.id;
    } else {
      return NextResponse.json(
        { message: "Client information is missing." },
        { status: 400 }
      );
    }

    // --- CRITICAL: Re-verify Room Availability and Calculate Price (Server-Side) ---
    const selectedRoomsFromDb = await prisma.room.findMany({
      where: { id: { in: roomIds } },
    });
    if (selectedRoomsFromDb.length !== roomIds.length) {
      return NextResponse.json(
        { message: "One or more selected rooms are invalid or not found." },
        { status: 404 }
      );
    }

    for (const room of selectedRoomsFromDb) {
      const conflictingReservations = await prisma.reservation.count({
        where: {
          status: {
            in: [
              PrismaReservationStatus.CONFIRMED,
              PrismaReservationStatus.PENDING,
              PrismaReservationStatus.CHECKED_IN,
            ],
          },
          rooms: { some: { id: room.id } },
          AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
        },
      });
      if (conflictingReservations > 0) {
        return NextResponse.json(
          {
            message: `Room ${room.name} (${room.roomNumber}) is no longer available for the selected dates. Please re-check availability.`,
          },
          { status: 409 }
        );
      }
    }

    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24))
    );
    const serverCalculatedTotalPrice =
      selectedRoomsFromDb.reduce((sum, room) => sum + room.pricePerNight, 0) *
      nights;

    if (
      Math.abs(clientCalculatedTotalPrice - serverCalculatedTotalPrice) > 0.01
    ) {
    }

    const newReservation = await prisma.reservation.create({
      data: {
        clientId: finalClientId,
        checkIn: checkIn, // Use the Date object
        checkOut: checkOut, // Use the Date object
        numAdults: numAdults,
        numChildren: numChildren || 0,
        totalPrice: serverCalculatedTotalPrice,
        status: PrismaReservationStatus.PENDING,
        promoCodeUsed: promoCodeUsed,
        createdByAgentId: agentUserId,
        rooms: { connect: roomIds.map((id) => ({ id })) },
        sourceLog: { create: { source: (source as any) || "RECEPTION" } },
        // specialRequests: specialRequests, // Add if you have this field on Reservation model
      },
      include: {
        client: { select: { name: true, email: true } },
        rooms: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Reservation created successfully by agent!",
        reservation: newReservation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_AGENT_CREATE_RESERVATION_ERROR:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "A user with the provided email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating reservation", detail: error.message },
      { status: 500 }
    );
  }
}
