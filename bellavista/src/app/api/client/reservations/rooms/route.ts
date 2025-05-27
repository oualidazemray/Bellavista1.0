// src/app/api/reservations/rooms/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  RoomType as PrismaRoomType,
  RoomView as PrismaRoomView,
  Prisma,
} from "@prisma/client";

// This should match the RoomData interface in your frontend
// We'll map Prisma's Room model to this structure.
interface ApiRoomData {
  id: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  name: string;
  description?: string | null;
  price: number; // This will be pricePerNight
  beds?: number | null;
  bedType: string; // Derived from bedConfiguration or type
  guests: number; // This is maxGuests
  view?: string | null; // String representation of RoomView enum
  characteristics?: string[];
  sqMeters?: number | null;
  rating?: number | null;
  featured?: boolean;
  currency?: string; // Added for consistency with frontend interface
  perNightText?: string;
  includesFeesText?: string;
}

// Helper to map Prisma RoomView enum to string or return undefined
function mapRoomViewToString(
  view: PrismaRoomView | null | undefined
): string | undefined {
  if (!view) return undefined;
  return PrismaRoomView[view]; // Returns the string key of the enum
}

// Helper to derive bedType string (example logic)
function deriveBedType(room: {
  type: PrismaRoomType;
  bedConfiguration?: string | null;
  beds?: number | null;
}): string {
  if (room.bedConfiguration) return room.bedConfiguration;
  switch (room.type) {
    case PrismaRoomType.SIMPLE:
      return `${room.beds || 1} Single Bed`;
    case PrismaRoomType.DOUBLE:
      return room.beds === 2 ? "2 Twin Beds" : "1 Double Bed";
    case PrismaRoomType.DOUBLE_CONFORT:
      return "1 Queen/King Bed";
    case PrismaRoomType.SUITE:
      return "1 King Bed + Sofa";
    default:
      return "Standard Bedding";
  }
}

export async function GET(request: NextRequest) {
  console.log("API_ROOMS_SEARCH: GET request received.");
  const { searchParams } = new URL(request.url);

  try {
    // --- Extract and Validate Required Parameters ---
    const arrivalDateStr = searchParams.get("arrivalDate");
    const departureDateStr = searchParams.get("departureDate");
    const adultsStr = searchParams.get("adults");
    const childrenStr = searchParams.get("children");

    if (!arrivalDateStr || !departureDateStr || !adultsStr || !childrenStr) {
      return NextResponse.json(
        {
          message:
            "Missing required search parameters: arrivalDate, departureDate, adults, children.",
        },
        { status: 400 }
      );
    }

    const arrivalDate = new Date(arrivalDateStr);
    const departureDate = new Date(departureDateStr);
    const adults = parseInt(adultsStr, 10);
    const children = parseInt(childrenStr, 10);
    const totalGuests = adults + children;

    if (
      isNaN(arrivalDate.getTime()) ||
      isNaN(departureDate.getTime()) ||
      isNaN(adults) ||
      isNaN(children)
    ) {
      return NextResponse.json(
        { message: "Invalid date or guest count format." },
        { status: 400 }
      );
    }
    if (arrivalDate >= departureDate) {
      return NextResponse.json(
        { message: "Departure date must be after arrival date." },
        { status: 400 }
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (arrivalDate < today) {
      return NextResponse.json(
        { message: "Arrival date cannot be in the past." },
        { status: 400 }
      );
    }
    if (totalGuests < 1) {
      return NextResponse.json(
        { message: "At least one guest is required." },
        { status: 400 }
      );
    }

    console.log(
      `API_ROOMS_SEARCH: Params: Arrival: ${arrivalDate}, Departure: ${departureDate}, Guests: ${totalGuests}`
    );

    // --- Extract Optional Filter Parameters ---
    const priceRangeStr = searchParams.get("priceRange");
    const maxPrice = priceRangeStr ? parseFloat(priceRangeStr) : undefined;
    const sortBy = searchParams.get("sortBy") || "recommended";
    const viewFilter = searchParams
      .get("view")
      ?.split(",")
      .filter((v) => v in PrismaRoomView) as PrismaRoomView[] | undefined;
    const bedTypeFilter = searchParams.get("bedType")?.split(","); // These need mapping to bedConfiguration or beds
    const characteristicsFilter = searchParams
      .get("characteristics")
      ?.split(",");

    // --- Build Prisma Where Clause for Room Availability ---
    // 1. Find rooms that are *booked* during the requested period
    const bookedRoomIds = await prisma.reservation
      .findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] }, // Active reservations
          AND: [
            // Overlap condition
            { checkIn: { lt: departureDate } },
            { checkOut: { gt: arrivalDate } },
          ],
        },
        select: {
          rooms: { select: { id: true } },
        },
      })
      .then((reservations) =>
        reservations.flatMap((r) => r.rooms.map((room) => room.id))
      );
    const uniqueBookedRoomIds = [...new Set(bookedRoomIds)]; // Ensure unique IDs
    console.log(
      `API_ROOMS_SEARCH: Booked room IDs during period: ${
        uniqueBookedRoomIds.length > 0 ? uniqueBookedRoomIds.join(", ") : "None"
      }`
    );

    // 2. Build where clause for available rooms, excluding booked ones and applying filters
    const roomWhereClause: Prisma.RoomWhereInput = {
      id: {
        notIn: uniqueBookedRoomIds.length > 0 ? uniqueBookedRoomIds : undefined,
      }, // Exclude booked rooms
      maxGuests: { gte: totalGuests }, // Room must accommodate the number of guests
      ...(maxPrice && { pricePerNight: { lte: maxPrice } }),
      ...(viewFilter && viewFilter.length > 0 && { view: { in: viewFilter } }),
      ...(characteristicsFilter &&
        characteristicsFilter.length > 0 && {
          characteristics: { hasSome: characteristicsFilter },
        }),
      // Bed type filtering is more complex:
      // You might need to filter on 'beds' field or do a text search on 'bedConfiguration'
      // Example for bedConfiguration (case-insensitive text search):
      ...(bedTypeFilter &&
        bedTypeFilter.length > 0 && {
          OR: bedTypeFilter.map((bt) => ({
            bedConfiguration: { contains: bt, mode: "insensitive" },
          })),
        }),
    };
    console.log(
      "API_ROOMS_SEARCH: Room whereClause:",
      JSON.stringify(roomWhereClause, null, 2)
    );

    // 3. Determine Sorting
    let orderByClause:
      | Prisma.RoomOrderByWithRelationInput
      | Prisma.RoomOrderByWithRelationInput[] = {};
    if (sortBy === "price_asc") {
      orderByClause = { pricePerNight: "asc" };
    } else if (sortBy === "price_desc") {
      orderByClause = { pricePerNight: "desc" };
    } else if (sortBy === "rating_desc") {
      orderByClause = [
        { rating: { sort: "desc", nulls: "last" } },
        { featured: "desc" },
      ]; // Prioritize rated, then featured
    } else {
      // Default to 'recommended' (featured first, then maybe rating or price)
      orderByClause = [
        { featured: "desc" },
        { rating: { sort: "desc", nulls: "last" } },
        { pricePerNight: "asc" },
      ];
    }

    // 4. Fetch available rooms
    const availableRoomsFromDb = await prisma.room.findMany({
      where: roomWhereClause,
      orderBy: orderByClause,
      // take: someLimit, // Add pagination later
      // skip: someOffset,
    });
    console.log(
      `API_ROOMS_SEARCH: Found ${availableRoomsFromDb.length} available rooms matching criteria.`
    );

    // 5. Map to frontend RoomData structure
    const mappedRooms: ApiRoomData[] = availableRoomsFromDb.map((room) => ({
      id: room.id,
      imageUrl: room.imageUrl,
      imageUrls: room.imageUrls,
      name: room.name,
      description: room.description,
      price: room.pricePerNight, // This is pricePerNight
      beds: room.beds,
      bedType: deriveBedType(room), // Use helper to get a string
      guests: room.maxGuests, // This is the room's capacity
      view: mapRoomViewToString(room.view), // Convert enum to string
      characteristics: room.characteristics,
      sqMeters: room.sqMeters,
      rating: room.rating,
      featured: room.featured,
      currency: "MAD", // Example, could be from config
      perNightText: "/ nuit",
      includesFeesText: "Taxes et frais inclus",
    }));

    return NextResponse.json(mappedRooms);
  } catch (error: any) {
    console.error("API_ROOMS_SEARCH_ERROR:", error);
    return NextResponse.json(
      { message: "Error searching for rooms", detail: error.message },
      { status: 500 }
    );
  }
}
