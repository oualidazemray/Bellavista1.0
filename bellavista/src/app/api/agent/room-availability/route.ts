// src/app/api/agent/room-availability/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  RoomType as PrismaRoomType,
  ReservationStatus,
  Prisma,
} from "@prisma/client";

export interface RoomAvailabilityItem {
  roomId: string;
  roomName: string;
  roomNumber: string;
  roomType: string; // String representation of PrismaRoomType
  maxGuests: number;
  // For each day in the requested range, what's its status?
  // Or, more simply, is the room available for the *entire* selected range?
  isAvailableForEntireRange: boolean;
  // Optionally, provide daily availability if you want a more granular calendar view
  // dailyStatus?: { date: string, status: 'available' | 'booked' | 'partial' }[];
  conflictingReservationIds?: string[]; // IDs of reservations blocking it
}

interface RoomAvailabilityRequest {
  startDate: string; // ISO Date string (YYYY-MM-DD)
  endDate: string; // ISO Date string
  roomTypeFilter?: PrismaRoomType | null;
  // Add other filters like minGuests, view, etc. if needed
}

export async function POST(request: NextRequest) {
  // Using POST to send date range and filters in body
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json(
      { message: "Unauthorized: Agent role required" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as RoomAvailabilityRequest;
    const {
      startDate: startDateString,
      endDate: endDateString,
      roomTypeFilter,
    } = body;

    if (!startDateString || !endDateString) {
      return NextResponse.json(
        { message: "Start date and end date are required." },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateString + "T00:00:00.000Z"); // Treat as start of day UTC
    const endDate = new Date(endDateString + "T23:59:59.999Z"); // Treat as end of day UTC
    // For Prisma overlap, it's often easier to make endDate exclusive for < comparison
    const exclusiveEndDateForPrisma = new Date(
      endDateString + "T00:00:00.000Z"
    );
    exclusiveEndDateForPrisma.setDate(exclusiveEndDateForPrisma.getDate() + 1);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      startDate >= endDate
    ) {
      return NextResponse.json(
        { message: "Invalid date range." },
        { status: 400 }
      );
    }
    console.log(
      `API_ROOM_AVAILABILITY: Checking for range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // 1. Get all rooms (or filtered rooms)
    const roomWhereClause: Prisma.RoomWhereInput = {};
    if (
      roomTypeFilter &&
      Object.values(PrismaRoomType).includes(roomTypeFilter)
    ) {
      roomWhereClause.type = roomTypeFilter;
    }
    // Add other room filters here (maxGuests, view etc.) if passed from frontend

    const allRooms = await prisma.room.findMany({
      where: roomWhereClause,
      select: {
        id: true,
        name: true,
        roomNumber: true,
        type: true,
        maxGuests: true,
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });
    console.log(
      `API_ROOM_AVAILABILITY: Found ${allRooms.length} rooms matching base criteria.`
    );

    // 2. For each room, check for conflicting reservations within the date range
    const availabilityResults: RoomAvailabilityItem[] = [];

    for (const room of allRooms) {
      const conflictingReservations = await prisma.reservation.findMany({
        where: {
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ],
          },
          rooms: { some: { id: room.id } },
          AND: [
            // Standard overlap condition
            { checkIn: { lt: exclusiveEndDateForPrisma } }, // Existing checkIn is before new checkOut
            { checkOut: { gt: startDate } }, // Existing checkOut is after new checkIn
          ],
        },
        select: { id: true }, // Only need IDs to check for existence
      });

      availabilityResults.push({
        roomId: room.id,
        roomName: room.name,
        roomNumber: room.roomNumber,
        roomType: PrismaRoomType[room.type],
        maxGuests: room.maxGuests,
        isAvailableForEntireRange: conflictingReservations.length === 0,
        conflictingReservationIds: conflictingReservations.map((r) => r.id),
      });
    }
    console.log(
      `API_ROOM_AVAILABILITY: Processed availability for ${availabilityResults.length} rooms.`
    );

    return NextResponse.json(availabilityResults);
  } catch (error: any) {
    console.error("API_ROOM_AVAILABILITY_ERROR:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error fetching room availability", detail: error.message },
      { status: 500 }
    );
  }
}
