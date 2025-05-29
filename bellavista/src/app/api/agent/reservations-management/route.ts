// src/app/api/agent/reservations-management/route.ts
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

// Interface for items returned in the list
export interface AgentReservationListItem {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  roomNames: string[]; // Could be multiple rooms
  checkIn: string; // ISO
  checkOut: string; // ISO
  numberOfGuests: number;
  totalPrice: number;
  status: PrismaReservationStatus;
  bookingDate: string; // ISO
  // Potentially add createdByAgentId if you want to filter by agent later
  // createdByAgentId?: string | null;
  // createdByAgentName?: string | null;
}

export async function GET(request: NextRequest) {
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
  // const agentUserId = token.id as string; // Useful if filtering by agent later

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "15"); // More items per page for management
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get(
    "status"
  ) as PrismaReservationStatus | null;
  const dateFilterType = searchParams.get("dateFilterType"); // 'checkIn', 'checkOut', 'booking'
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const skip = (page - 1) * limit;

  try {
    const whereConditions: Prisma.ReservationWhereInput[] = [];

    if (searchQuery) {
      whereConditions.push({
        OR: [
          { client: { name: { contains: searchQuery, mode: "insensitive" } } },
          { client: { email: { contains: searchQuery, mode: "insensitive" } } },
          { id: { contains: searchQuery, mode: "insensitive" } },
          {
            rooms: {
              some: {
                roomNumber: { contains: searchQuery, mode: "insensitive" },
              },
            },
          },
          {
            rooms: {
              some: { name: { contains: searchQuery, mode: "insensitive" } },
            },
          },
        ],
      });
    }

    if (
      statusFilter &&
      Object.values(PrismaReservationStatus).includes(statusFilter)
    ) {
      whereConditions.push({ status: statusFilter });
    }

    if (dateFilterType && dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(dateTo);
      endDate.setUTCHours(23, 59, 59, 999);

      if (dateFilterType === "checkIn")
        whereConditions.push({ checkIn: { gte: startDate, lte: endDate } });
      else if (dateFilterType === "checkOut")
        whereConditions.push({ checkOut: { gte: startDate, lte: endDate } });
      else if (dateFilterType === "booking")
        whereConditions.push({ createdAt: { gte: startDate, lte: endDate } });
    }

    const finalWhereClause: Prisma.ReservationWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};
    console.log(
      "AGENT_RESERVATIONS_API: Final where clause:",
      JSON.stringify(finalWhereClause)
    );

    const reservationsFromDb = await prisma.reservation.findMany({
      where: finalWhereClause,
      include: {
        client: { select: { name: true, email: true, phone: true } },
        rooms: { select: { name: true, roomNumber: true, type: true } },
        // If you track which agent created the booking:
        // createdByAgent: { select: { name: true } }
      },
      orderBy: { checkIn: "asc" }, // Default sort: upcoming check-ins first
      skip: skip,
      take: limit,
    });

    const totalReservations = await prisma.reservation.count({
      where: finalWhereClause,
    });

    const mappedData: AgentReservationListItem[] = reservationsFromDb.map(
      (res) => ({
        id: res.id,
        clientName: res.client.name,
        clientEmail: res.client.email,
        clientPhone: res.client.phone,
        roomNames: res.rooms.map(
          (r) => `${r.name} (${r.roomNumber || PrismaRoomType[r.type]})`
        ),
        checkIn: res.checkIn.toISOString(),
        checkOut: res.checkOut.toISOString(),
        numberOfGuests: res.numAdults + (res.numChildren || 0),
        totalPrice: res.totalPrice,
        bookingDate: res.createdAt.toISOString(),
        status: res.status,
        // createdByAgentName: res.createdByAgent?.name // if relation exists
      })
    );

    return NextResponse.json({
      reservations: mappedData,
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: page,
      totalReservations,
    });
  } catch (error: any) {
    console.error("API_AGENT_RESERVATIONS_MANAGEMENT_GET_ERROR:", error);
    return NextResponse.json(
      {
        message: "Error fetching reservations for agent",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
