// src/app/api/admin/pending-reservations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  ReservationStatus,
  Role,
  RoomType as PrismaRoomType,
} from "@prisma/client";

export interface PendingReservationAdminView {
  id: string;
  clientName: string;
  clientEmail: string;
  hotelName: string; // Or general room name if no distinct hotel model
  roomTypes: string[]; // List of room types in the reservation
  checkIn: string; // ISO Date string
  checkOut: string; // ISO Date string
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string; // ISO Date string (createdAt)
  status: ReservationStatus;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Optional: Add pagination later
  // const { searchParams } = new URL(request.url);
  // const page = parseInt(searchParams.get('page') || '1');
  // const limit = parseInt(searchParams.get('limit') || '10');
  // const skip = (page - 1) * limit;

  try {
    const pendingReservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
      },
      include: {
        client: {
          select: { name: true, email: true },
        },
        rooms: {
          select: { name: true, type: true }, // Get name and type of booked rooms
        },
      },
      orderBy: {
        createdAt: "asc", // Show oldest pending reservations first
      },
      // take: limit,
      // skip: skip,
    });

    // const totalPending = await prisma.reservation.count({where: { status: ReservationStatus.PENDING }});

    const mappedData: PendingReservationAdminView[] = pendingReservations.map(
      (res) => {
        const roomTypes =
          res.rooms.map((room) => PrismaRoomType[room.type]).join(", ") ||
          "N/A";
        // A more sophisticated hotelName might come from a room.hotel relation or a general setting
        const hotelName =
          res.rooms.length > 0
            ? res.rooms[0].name.split("-")[0].trim()
            : "Hotel Bellavista"; // Basic attempt

        return {
          id: res.id,
          clientName: res.client.name,
          clientEmail: res.client.email,
          hotelName: hotelName, // This is simplified
          roomTypes: res.rooms.map((room) => PrismaRoomType[room.type]), // Array of room types
          checkIn: res.checkIn.toISOString(),
          checkOut: res.checkOut.toISOString(),
          numberOfGuests: res.numAdults + (res.numChildren || 0),
          totalPrice: res.totalPrice,
          bookingDate: res.createdAt.toISOString(),
          status: res.status,
        };
      }
    );

    return NextResponse.json({
      reservations: mappedData,
      // totalPages: Math.ceil(totalPending / limit),
      // currentPage: page,
    });
  } catch (error: any) {
    console.error("API_ADMIN_PENDING_RESERVATIONS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching pending reservations", detail: error.message },
      { status: 500 }
    );
  }
}
