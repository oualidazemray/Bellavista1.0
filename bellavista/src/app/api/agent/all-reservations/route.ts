// src/app/api/admin/all-reservations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  ReservationStatus as PrismaReservationStatus,
  Prisma,
  RoomType as PrismaRoomType,
} from "@prisma/client";

// Interface for items returned in the list, matching frontend expectations
export interface AdminReservationListItem {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  hotelName: string; // This will be derived, often from the first room's name
  roomTypes: string[]; // Array of room type strings (e.g., ["SUITE", "DOUBLE"])
  checkIn: string; // ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ)
  checkOut: string; // ISO string format
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string; // ISO string format (from Reservation.createdAt)
  status: PrismaReservationStatus; // Send the Prisma enum string value
}

interface FetchReservationsAdminResponse {
  reservations: AdminReservationListItem[];
  totalPages: number;
  currentPage: number;
  totalReservations: number;
}

export async function GET(request: NextRequest) {
  console.log("API_ADMIN_ALL_RESERVATIONS_GET: Handler started.");
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== Role.ADMIN) {
    // Ensure this is for ADMIN or adapt if for AGENT
    console.log(
      "API_ADMIN_ALL_RESERVATIONS_GET: Unauthorized access attempt. Token:",
      token
    );
    return NextResponse.json(
      { message: "Unauthorized: Admin role required." },
      { status: 401 }
    );
  }
  // const adminUserId = token.id as string; // If needed later

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10"); // Default to 10 per page
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get(
    "status"
  ) as PrismaReservationStatus | null;
  const dateFilterType = searchParams.get("dateFilterType"); // 'checkIn', 'checkOut', 'booking'
  const dateFrom = searchParams.get("dateFrom"); // Expect YYYY-MM-DD string
  const dateTo = searchParams.get("dateTo"); // Expect YYYY-MM-DD string

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
      "API_ADMIN_ALL_RESERVATIONS_GET: Final where clause:",
      JSON.stringify(finalWhereClause)
    );

    const reservationsFromDb = await prisma.reservation.findMany({
      where: finalWhereClause,
      include: {
        client: { select: { name: true, email: true, phone: true } },
        rooms: { select: { name: true, roomNumber: true, type: true } }, // Select 'type'
        // createdByAgent: { select: { name: true } } // If you add this relation
      },
      orderBy: { checkIn: "asc" }, // Default sort: upcoming check-ins first
      skip: skip,
      take: limit,
    });

    const totalReservations = await prisma.reservation.count({
      where: finalWhereClause,
    });
    console.log(
      `API_ADMIN_ALL_RESERVATIONS_GET: Fetched ${reservationsFromDb.length} reservations from DB.`
    );

    const mappedData: AdminReservationListItem[] = reservationsFromDb.map(
      (res) => {
        const firstRoom =
          res.rooms && res.rooms.length > 0 ? res.rooms[0] : null;

        // Ensure roomTypes is always an array of strings
        const currentRoomTypes: string[] = (res.rooms || [])
          .map((room) => {
            if (room.type && PrismaRoomType[room.type]) {
              // This gives the string key of the enum, e.g., "SIMPLE", "DOUBLE"
              return PrismaRoomType[room.type];
            }
            return "Unknown Type"; // Fallback if room.type is missing or not a valid enum key
          })
          .filter(Boolean) as string[]; // Filter out any potential null/undefined values and assert as string[]

        // Determine hotelName (this is a simplified approach)
        // Ideally, Room would link to a Hotel model, or Reservation would store hotelName
        let hotelName = "Hotel Bellavista"; // Default
        if (firstRoom && firstRoom.name) {
          // Attempt to extract hotel name if room name is like "Hotel Name - Room Type"
          const nameParts = firstRoom.name.split(" - ");
          if (nameParts.length > 1) {
            hotelName = nameParts[0].trim();
          } else {
            hotelName = firstRoom.name; // Use full room name if no clear delimiter
          }
        } else if (res.rooms.length > 0) {
          hotelName = "Various Rooms"; // If no name on first room but rooms exist
        }

        return {
          id: res.id,
          clientName: res.client.name,
          clientEmail: res.client.email,
          clientPhone: res.client.phone,
          hotelName: hotelName,
          roomTypes: currentRoomTypes.length > 0 ? currentRoomTypes : ["N/A"], // Ensure not empty if no types found
          checkIn: res.checkIn.toISOString(),
          checkOut: res.checkOut.toISOString(),
          numberOfGuests: res.numAdults + (res.numChildren || 0),
          totalPrice: res.totalPrice,
          bookingDate: res.createdAt.toISOString(),
          status: res.status, // Send the Prisma enum value directly
        };
      }
    );
    console.log(
      "API_ADMIN_ALL_RESERVATIONS_GET: Mapped data example (first item):",
      mappedData[0]
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
      {
        message: "Error fetching reservations for admin",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
