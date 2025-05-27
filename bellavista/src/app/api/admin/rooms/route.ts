// src/app/api/admin/rooms/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, RoomType, RoomView, Prisma } from "@prisma/client";

// Interface for data returned for each room in the list
export interface AdminRoomListItem {
  id: string;
  name: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  pricePerNight: number;
  maxGuests: number;
  view?: RoomView | null;
  featured: boolean;
  imageUrl?: string | null; // Main image for preview
  // Add other summary fields if needed for the list view
}

// Interface for request body when creating/updating a room
// This should encompass all editable fields of the Room model
export interface UpsertRoomRequestBody {
  name: string;
  description?: string | null;
  roomNumber: string;
  type: RoomType;
  floor: number;
  pricePerNight: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  maxGuests: number;
  beds?: number | null;
  bedConfiguration?: string | null;
  view?: RoomView | null;
  characteristics?: string[];
  sqMeters?: number | null;
  featured?: boolean;
  rating?: number | null;
  // assignedToId?: string | null; // Handled separately if needed
}

// GET: Fetch all rooms with pagination and optional filters/search
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
  const searchQuery = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") as RoomType | null;
  const viewFilter = searchParams.get("view") as RoomView | null;
  const featuredFilter = searchParams.get("featured"); // "true" or "false"

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.RoomWhereInput = {};
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { roomNumber: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ];
    }
    if (typeFilter && Object.values(RoomType).includes(typeFilter)) {
      whereClause.type = typeFilter;
    }
    if (viewFilter && Object.values(RoomView).includes(viewFilter)) {
      whereClause.view = viewFilter;
    }
    if (featuredFilter === "true") {
      whereClause.featured = true;
    } else if (featuredFilter === "false") {
      whereClause.featured = false;
    }

    const rooms = await prisma.room.findMany({
      where: whereClause,
      select: {
        // Select fields needed for the list view
        id: true,
        name: true,
        roomNumber: true,
        type: true,
        floor: true,
        pricePerNight: true,
        maxGuests: true,
        view: true,
        featured: true,
        imageUrl: true, // For a small preview in the list
        // _count: { select: { reservations: true } } // Example: count active reservations
      },
      orderBy: { roomNumber: "asc" }, // Default sort
      skip: skip,
      take: limit,
    });

    const totalRooms = await prisma.room.count({ where: whereClause });

    return NextResponse.json({
      rooms,
      totalPages: Math.ceil(totalRooms / limit),
      currentPage: page,
      totalRooms,
    });
  } catch (error: any) {
    console.error("API_ADMIN_ROOMS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching rooms", detail: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new room
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json(
      { message: "Unauthorized to create room" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as UpsertRoomRequestBody;
    console.log("API_ADMIN_ROOMS_POST: Received body:", body);

    // --- Validation ---
    if (
      !body.name ||
      !body.roomNumber ||
      !body.type ||
      body.pricePerNight === undefined ||
      body.maxGuests === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "Name, Room Number, Type, Price Per Night, and Max Guests are required.",
        },
        { status: 400 }
      );
    }
    if (!Object.values(RoomType).includes(body.type)) {
      return NextResponse.json(
        { message: "Invalid room type." },
        { status: 400 }
      );
    }
    if (body.view && !Object.values(RoomView).includes(body.view)) {
      return NextResponse.json(
        { message: "Invalid room view." },
        { status: 400 }
      );
    }
    if (body.pricePerNight < 0 || body.maxGuests < 1) {
      return NextResponse.json(
        { message: "Price and Max Guests must be positive values." },
        { status: 400 }
      );
    }

    // Check for unique room number
    const existingRoomByNumber = await prisma.room.findUnique({
      where: { roomNumber: body.roomNumber },
    });
    if (existingRoomByNumber) {
      return NextResponse.json(
        { message: `Room number '${body.roomNumber}' already exists.` },
        { status: 409 }
      ); // Conflict
    }

    const newRoom = await prisma.room.create({
      data: {
        name: body.name,
        description: body.description,
        roomNumber: body.roomNumber,
        type: body.type,
        floor: body.floor,
        pricePerNight: body.pricePerNight,
        imageUrl: body.imageUrl,
        imageUrls: body.imageUrls || [], // Default to empty array if not provided
        maxGuests: body.maxGuests,
        beds: body.beds,
        bedConfiguration: body.bedConfiguration,
        view: body.view,
        characteristics: body.characteristics || [], // Default to empty array
        sqMeters: body.sqMeters,
        featured: body.featured || false, // Default to false
        rating: body.rating,
      },
    });
    console.log("API_ADMIN_ROOMS_POST: New room created:", newRoom.id);
    return NextResponse.json(
      { message: "Room created successfully", room: newRoom },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_ADMIN_ROOMS_POST_ERROR:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === "P2002" &&
        error.meta?.target?.includes("roomNumber")
      ) {
        return NextResponse.json(
          { message: "Room number must be unique." },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error creating room", detail: error.message },
      { status: 500 }
    );
  }
}
