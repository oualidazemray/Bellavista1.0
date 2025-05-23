// src/app/api/reservations/rooms/route.ts
import { NextResponse } from "next/server";
import {
  PrismaClient,
  RoomType,
  RoomView,
  ReservationStatus,
} from "@prisma/client";
import { z, ZodError } from "zod";

const prisma = new PrismaClient();

const searchParamsSchema = z.object({
  arrivalDate: z
    .string()
    .datetime({ message: "Arrival date must be a valid ISO date string." }),
  departureDate: z
    .string()
    .datetime({ message: "Departure date must be a valid ISO date string." }),
  adults: z
    .string()
    .regex(/^\d+$/, "Adults must be a non-negative integer.")
    .transform(Number),
  children: z
    .string()
    .regex(/^\d+$/, "Children must be a non-negative integer.")
    .transform(Number),
  priceRange: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Price range must be a number.")
    .transform(Number)
    .optional(),
  view: z.string().optional(),
  bedType: z.string().optional(),
  characteristics: z.string().optional(),
  sortBy: z
    .enum(["recommended", "lowest", "highest"])
    .optional()
    .default("recommended"),
});

function getPrismaBedTypeConditions(filterBedTypes: string[]): any[] {
  if (
    !filterBedTypes ||
    filterBedTypes.length === 0 ||
    (filterBedTypes.length === 1 &&
      filterBedTypes[0].toLowerCase().trim() === "various")
  ) {
    return [];
  }
  const orConditions: any[] = [];
  filterBedTypes.forEach((fb) => {
    const filter = fb.toLowerCase().trim();
    if (filter === "various") return;
    if (filter === "king") {
      orConditions.push({
        bedConfiguration: { contains: "King", mode: "insensitive" },
      });
      orConditions.push({ type: RoomType.SUITE });
    } else if (filter === "queen") {
      orConditions.push({
        bedConfiguration: { contains: "Queen", mode: "insensitive" },
      });
      orConditions.push({ type: RoomType.DOUBLE_CONFORT });
    } else if (filter === "twin") {
      orConditions.push({
        bedConfiguration: { contains: "Twin", mode: "insensitive" },
      });
      orConditions.push({ type: RoomType.DOUBLE });
    } else if (filter === "simple" || filter === "single") {
      orConditions.push({
        bedConfiguration: { contains: "Single", mode: "insensitive" },
      });
      orConditions.push({ type: RoomType.SIMPLE });
    }
  });
  const uniqueOrConditions = Array.from(
    new Set(orConditions.map((c) => JSON.stringify(c)))
  ).map((s) => JSON.parse(s));
  if (uniqueOrConditions.length > 0) {
    return [{ OR: uniqueOrConditions }];
  }
  return [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    console.log("[API /api/reservations/rooms] Raw Query Params:", rawParams);

    const validationResult = searchParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      console.error(
        "[API /api/reservations/rooms] Validation Error:",
        validationResult.error.flatten().fieldErrors
      );
      return NextResponse.json(
        {
          error: "Invalid search parameters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      arrivalDate: arrivalDateStr,
      departureDate: departureDateStr,
      adults,
      children,
      priceRange,
      view: viewStr,
      bedType: bedTypeStr,
      characteristics: characteristicsStr,
      sortBy,
    } = validationResult.data;

    const arrival = new Date(arrivalDateStr);
    const departure = new Date(departureDateStr);
    const totalGuests = adults + children;

    if (arrival.getTime() >= departure.getTime())
      return NextResponse.json(
        { error: "Departure date must be after arrival date." },
        { status: 400 }
      );
    if (totalGuests <= 0)
      return NextResponse.json(
        { error: "Number of guests must be at least 1." },
        { status: 400 }
      );

    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        AND: [{ checkIn: { lt: departure } }, { checkOut: { gt: arrival } }],
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
        },
      },
      select: { rooms: { select: { id: true } } },
    });
    const bookedRoomIds = new Set<string>(
      overlappingReservations.flatMap((res) => res.rooms.map((room) => room.id))
    );
    console.log(
      `[API /api/reservations/rooms] Booked Room IDs: ${Array.from(
        bookedRoomIds
      )}`
    );

    const whereClause: { AND: any[] } = {
      AND: [
        { id: { notIn: Array.from(bookedRoomIds) } },
        { maxGuests: { gte: totalGuests } },
      ],
    };
    if (priceRange !== undefined)
      whereClause.AND.push({ pricePerNight: { lte: priceRange } });

    const viewFilterArray = viewStr
      ?.split(",")
      .map((v) => v.trim().toUpperCase())
      .filter((v) => v && Object.values(RoomView).includes(v as RoomView)) as
      | RoomView[]
      | undefined;
    if (viewFilterArray && viewFilterArray.length > 0)
      whereClause.AND.push({ view: { in: viewFilterArray } });

    const frontendBedTypeFilters = bedTypeStr
      ?.split(",")
      .map((bt) => bt.trim().toLowerCase())
      .filter((bt) => bt);
    if (frontendBedTypeFilters && frontendBedTypeFilters.length > 0) {
      const bedTypeConditions = getPrismaBedTypeConditions(
        frontendBedTypeFilters
      );
      if (bedTypeConditions.length > 0)
        whereClause.AND.push(...bedTypeConditions);
    }

    const characteristicsFilterArray = characteristicsStr
      ?.split(",")
      .map((c) => c.trim())
      .filter((c) => c);
    if (characteristicsFilterArray && characteristicsFilterArray.length > 0) {
      characteristicsFilterArray.forEach((char) =>
        whereClause.AND.push({ characteristics: { has: char } })
      );
    }

    let orderByClause: any = [
      { featured: "desc" },
      { rating: "desc" },
      { pricePerNight: "asc" },
    ]; // Default recommended
    if (sortBy === "lowest") orderByClause = { pricePerNight: "asc" };
    else if (sortBy === "highest") orderByClause = { pricePerNight: "desc" };

    console.log(
      "[API /api/reservations/rooms] Prisma Query Where:",
      JSON.stringify(whereClause, null, 2)
    );
    console.log(
      "[API /api/reservations/rooms] Prisma Order By:",
      JSON.stringify(orderByClause, null, 2)
    );

    const dbRooms = await prisma.room.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
    console.log(`[API /api/reservations/rooms] Found ${dbRooms.length} rooms.`);

    const frontendReadyRooms = dbRooms.map((room) => {
      let displayBedType = room.bedConfiguration || room.type.toString();
      if (room.beds && room.bedConfiguration)
        displayBedType = room.bedConfiguration;
      else if (room.beds)
        displayBedType = `${room.beds} bed(s) - ${room.type.toString()}`;
      return {
        id: room.id,
        imageUrl:
          room.imageUrl ||
          `https://via.placeholder.com/600x400?text=${encodeURIComponent(
            room.name
          )}`,
        imageUrls:
          room.imageUrls && room.imageUrls.length > 0
            ? room.imageUrls
            : room.imageUrl
            ? [room.imageUrl]
            : [],
        name: room.name,
        description: room.description,
        price: room.pricePerNight,
        beds: room.beds,
        bedType: displayBedType,
        guests: room.maxGuests,
        view: room.view?.toString(),
        characteristics: room.characteristics,
        sqMeters: room.sqMeters,
        rating: room.rating,
        featured: room.featured,
        currency: "MAD",
        perNightText: "Par nuit",
        includesFeesText: "Y compris tous les frais",
      };
    });
    return NextResponse.json(frontendReadyRooms);
  } catch (error) {
    console.error("[API /api/reservations/rooms] Error:", error);
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: "Invalid params", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma
      .$disconnect()
      .catch((e) =>
        console.error(
          "[API /api/reservations/rooms] Prisma Disconnect Error:",
          e
        )
      );
  }
}
