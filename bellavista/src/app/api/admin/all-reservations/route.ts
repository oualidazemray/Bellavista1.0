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

export interface AdminOrAgentReservationListItem {
  // Renamed interface for clarity
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  hotelName: string;
  roomTypes: string[];
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string;
  status: PrismaReservationStatus;
}

interface FetchReservationsResponse {
  // Renamed for clarity
  reservations: AdminOrAgentReservationListItem[];
  totalPages: number;
  currentPage: number;
  totalReservations: number;
}

export async function GET(request: NextRequest) {
  console.log("API_ALL_RESERVATIONS_GET (Admin/Agent): Handler started."); // Updated log prefix
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // --- MODIFIED AUTHORIZATION CHECK ---
  if (
    !token ||
    !token.id ||
    (token.role !== Role.ADMIN && token.role !== Role.AGENT)
  ) {
    console.log(
      "API_ALL_RESERVATIONS_GET: Unauthorized access attempt. Role required: ADMIN or AGENT. Token:",
      token
    );
    return NextResponse.json(
      { message: "Unauthorized: Admin or Agent role required." },
      { status: 401 }
    );
  }
  const currentUserId = token.id as string; // ID of the logged-in admin or agent
  console.log(
    `API_ALL_RESERVATIONS_GET: Authorized ${token.role}. User ID: ${currentUserId}`
  );

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get(
    "status"
  ) as PrismaReservationStatus | null;
  const dateFilterType = searchParams.get("dateFilterType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const skip = (page - 1) * limit;

  try {
    const whereConditions: Prisma.ReservationWhereInput[] = [];

    if (searchQuery) {
      /* ... your existing search logic ... */
    }
    if (
      statusFilter &&
      Object.values(PrismaReservationStatus).includes(statusFilter)
    ) {
      /* ... */
    }
    if (dateFilterType && dateFrom && dateTo) {
      /* ... your existing date filter logic ... */
    }

    const finalWhereClause: Prisma.ReservationWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};
    // console.log("API_ALL_RESERVATIONS_GET: Final where clause:", JSON.stringify(finalWhereClause));

    const reservationsFromDb = await prisma.reservation.findMany({
      where: finalWhereClause,
      include: {
        client: { select: { name: true, email: true, phone: true } },
        rooms: { select: { name: true, roomNumber: true, type: true } },
      },
      orderBy: { checkIn: "asc" },
      skip: skip,
      take: limit,
    });

    const totalReservations = await prisma.reservation.count({
      where: finalWhereClause,
    });
    // console.log(`API_ALL_RESERVATIONS_GET: Fetched ${reservationsFromDb.length} reservations from DB.`);

    const mappedData: AdminOrAgentReservationListItem[] =
      reservationsFromDb.map((res) => {
        const firstRoom = res.rooms.length > 0 ? res.rooms[0] : null;
        const currentRoomTypes: string[] = (res.rooms || [])
          .map((room) =>
            room.type ? PrismaRoomType[room.type] : "Unknown Type"
          )
          .filter(Boolean) as string[];
        let hotelName = firstRoom?.name || "Hotel Bellavista";
        if (firstRoom && firstRoom.name && firstRoom.name.includes(" - "))
          hotelName = firstRoom.name.split(" - ")[0].trim();

        return {
          id: res.id,
          clientName: res.client.name,
          clientEmail: res.client.email,
          clientPhone: res.client.phone,
          hotelName: hotelName,
          roomTypes: currentRoomTypes.length > 0 ? currentRoomTypes : ["N/A"],
          checkIn: res.checkIn.toISOString(),
          checkOut: res.checkOut.toISOString(),
          numberOfGuests: res.numAdults + (res.numChildren || 0),
          totalPrice: res.totalPrice,
          bookingDate: res.createdAt.toISOString(),
          status: res.status,
        };
      });
    // console.log("API_ALL_RESERVATIONS_GET: Mapped data example (first item):", mappedData[0]);

    return NextResponse.json({
      reservations: mappedData,
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: page,
      totalReservations,
    });
  } catch (error: any) {
    console.error("API_ALL_RESERVATIONS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching reservations", detail: error.message },
      { status: 500 }
    );
  }
}
