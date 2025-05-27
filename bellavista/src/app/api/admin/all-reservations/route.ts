// src/app/api/admin/all-reservations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  ReservationStatus as PrismaReservationStatus,
  Prisma,
  RoomType as PrismaRoomType,
} from "@prisma/client";

export interface AdminReservationListItem {
  id: string;
  clientName: string;
  clientEmail: string;
  hotelName: string; // Or primary room name
  roomTypes: string[];
  checkIn: string; // ISO
  checkOut: string; // ISO
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string; // ISO
  status: PrismaReservationStatus;
  // Add any other fields needed for the admin list view
  // e.g., if admin can see if feedback was left (though feedback is by client)
  // hasClientFeedback?: boolean;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || ""; // Search client name, email, res ID
  const statusFilter = searchParams.get(
    "status"
  ) as PrismaReservationStatus | null;
  const dateFrom = searchParams.get("dateFrom"); // For check-in date range
  const dateTo = searchParams.get("dateTo"); // For check-in date range

  const skip = (page - 1) * limit;

  try {
    const whereConditions: Prisma.ReservationWhereInput[] = [];

    if (searchQuery) {
      whereConditions.push({
        OR: [
          { client: { name: { contains: searchQuery, mode: "insensitive" } } },
          { client: { email: { contains: searchQuery, mode: "insensitive" } } },
          { id: { contains: searchQuery, mode: "insensitive" } },
          // Could also search room names if desired, by adding to OR and include
        ],
      });
    }

    if (
      statusFilter &&
      Object.values(PrismaReservationStatus).includes(statusFilter)
    ) {
      whereConditions.push({ status: statusFilter });
    }

    if (dateFrom) {
      const startDate = new Date(dateFrom);
      startDate.setUTCHours(0, 0, 0, 0);
      whereConditions.push({ checkIn: { gte: startDate } });
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      whereConditions.push({ checkIn: { lte: endDate } }); // Filter reservations starting within the range
    }

    const finalWhereClause: Prisma.ReservationWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const reservationsFromDb = await prisma.reservation.findMany({
      where: finalWhereClause,
      include: {
        client: { select: { name: true, email: true } },
        rooms: { select: { name: true, type: true }, take: 1 }, // For summary
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const totalReservations = await prisma.reservation.count({
      where: finalWhereClause,
    });

    const mappedData: AdminReservationListItem[] = reservationsFromDb.map(
      (res) => {
        const firstRoom = res.rooms.length > 0 ? res.rooms[0] : null;
        return {
          id: res.id,
          clientName: res.client.name,
          clientEmail: res.client.email,
          hotelName: firstRoom?.name || "N/A", // More accurate if Room links to Hotel
          roomTypes: res.rooms.map((r) => PrismaRoomType[r.type]),
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
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: page,
      totalReservations,
    });
  } catch (error: any) {
    console.error("API_ADMIN_ALL_RESERVATIONS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching all reservations", detail: error.message },
      { status: 500 }
    );
  }
}
