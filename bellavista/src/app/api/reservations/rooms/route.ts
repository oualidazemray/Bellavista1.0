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
export interface ApiRoomData {
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
  currency?: string;
}

function mapPrismaRoomViewToString(
  view: PrismaRoomView | null | undefined
): string | undefined {
  if (!view) return undefined;
  return PrismaRoomView[view]; // Returns the string key of the enum
}

function deriveAgentBedType(room: {
  type: PrismaRoomType;
  bedConfiguration?: string | null;
  beds?: number | null;
}): string {
  if (room.bedConfiguration) return room.bedConfiguration;
  // Simplified mapping, align with your actual RoomType enum values
  switch (room.type) {
    case PrismaRoomType.SIMPLE:
      return `${room.beds || 1} Single Bed(s)`;
    case PrismaRoomType.DOUBLE:
      return room.beds === 2 ? "2 Twin Beds" : "1 Double Bed";
    case PrismaRoomType.DOUBLE_CONFORT:
      return "1 Queen/King Bed (Comfort)";
    case PrismaRoomType.SUITE:
      return "Suite with King Bed";
    default:
      return "Standard Bedding";
  }
}

export async function GET(request: NextRequest) {
  console.log("API_ROOMS_SEARCH (Agent Flow): GET request received.");
  const { searchParams } = new URL(request.url);

  try {
    const arrivalDateStr = searchParams.get("arrivalDate");
    const departureDateStr = searchParams.get("departureDate");
    const adultsStr = searchParams.get("adults");
    const childrenStr = searchParams.get("children");

    if (!arrivalDateStr || !departureDateStr || !adultsStr || !childrenStr) {
      return NextResponse.json(
        {
          message: "Missing required search parameters: dates & guest counts.",
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
      isNaN(children) ||
      totalGuests < 1 ||
      arrivalDate >= departureDate
    ) {
      return NextResponse.json(
        { message: "Invalid date or guest count format." },
        { status: 400 }
      );
    }
    // Add past date check if needed

    console.log(
      `API_ROOMS_SEARCH: Params: Arrival: ${arrivalDate}, Departure: ${departureDate}, Guests: ${totalGuests}`
    );

    // Agent Filters
    const maxPriceStr = searchParams.get("maxPrice");
    const minGuestsStr = searchParams.get("minGuests"); // Agent might filter for rooms that can hold AT LEAST X guests
    const roomTypeFilter = searchParams.get(
      "roomType"
    ) as PrismaRoomType | null;
    const viewFilter = searchParams.get("view") as PrismaRoomView | null;
    const sortBy = searchParams.get("sortBy") || "price_asc"; // Default sort for agent might be price

    // --- Build Prisma Where Clause for Room Availability ---
    const bookedRoomIds = await prisma.reservation
      .findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          AND: [
            { checkIn: { lt: departureDate } },
            { checkOut: { gt: arrivalDate } },
          ],
        },
        select: { rooms: { select: { id: true } } },
      })
      .then((reservations) =>
        reservations.flatMap((r) => r.rooms.map((room) => room.id))
      );
    const uniqueBookedRoomIds = [...new Set(bookedRoomIds)];

    const roomWhereConditions: Prisma.RoomWhereInput[] = [
      { maxGuests: { gte: totalGuests } }, // Core: room must fit the booking party
    ];
    if (uniqueBookedRoomIds.length > 0) {
      roomWhereConditions.push({ id: { notIn: uniqueBookedRoomIds } });
    }

    if (maxPriceStr) {
      const maxP = parseFloat(maxPriceStr);
      if (!isNaN(maxP) && maxP > 0)
        roomWhereConditions.push({ pricePerNight: { lte: maxP } });
    }
    if (minGuestsStr) {
      // This is an additional filter on room's own maxGuests property
      const minG = parseInt(minGuestsStr, 10);
      if (!isNaN(minG) && minG > 0)
        roomWhereConditions.push({ maxGuests: { gte: minG } });
    }
    if (
      roomTypeFilter &&
      Object.values(PrismaRoomType).includes(roomTypeFilter)
    ) {
      roomWhereConditions.push({ type: roomTypeFilter });
    }
    if (viewFilter && Object.values(PrismaRoomView).includes(viewFilter)) {
      roomWhereConditions.push({ view: viewFilter });
    }
    // Add characteristics and bedType filtering if AgentRoomFilter supports them

    const finalRoomWhereClause: Prisma.RoomWhereInput = {
      AND: roomWhereConditions,
    };
    console.log(
      "API_ROOMS_SEARCH: Room whereClause:",
      JSON.stringify(finalRoomWhereClause, null, 2)
    );

    let orderByClause:
      | Prisma.RoomOrderByWithRelationInput
      | Prisma.RoomOrderByWithRelationInput[] = { pricePerNight: "asc" }; // Default for agent
    if (sortBy === "price_desc") orderByClause = { pricePerNight: "desc" };
    else if (sortBy === "rating_desc")
      orderByClause = [
        { rating: { sort: "desc", nulls: "last" } },
        { featured: "desc" },
      ];
    else if (sortBy === "featured")
      orderByClause = [
        { featured: "desc" },
        { rating: { sort: "desc", nulls: "last" } },
      ];

    const availableRoomsFromDb = await prisma.room.findMany({
      where: finalRoomWhereClause,
      orderBy: orderByClause,
    });
    console.log(
      `API_ROOMS_SEARCH: Found ${availableRoomsFromDb.length} available rooms.`
    );

    const mappedRooms: ApiRoomData[] = availableRoomsFromDb.map((room) => ({
      id: room.id,
      imageUrl: room.imageUrl,
      imageUrls: room.imageUrls,
      name: room.name,
      description: room.description,
      price: room.pricePerNight,
      beds: room.beds,
      bedType: deriveAgentBedType(room),
      guests: room.maxGuests,
      view: mapPrismaRoomViewToString(room.view),
      characteristics: room.characteristics,
      sqMeters: room.sqMeters,
      rating: room.rating,
      featured: room.featured,
      currency: "MAD", // Assuming MAD
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
