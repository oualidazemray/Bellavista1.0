// src/app/api/admin/rooms/[roomId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, RoomType, RoomView, Prisma } from "@prisma/client";
import { UpsertRoomRequestBody } from "../route"; // Import from the sibling route file

interface RouteContext {
  params: {
    roomId: string;
  };
}

// GET: Fetch details of a single room
export async function GET(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { roomId } = context.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      // Include related data if needed for an edit form, e.g., assigned staff
      // include: { assignedTo: { select: { id: true, name: true } } }
    });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error: any) {
    console.error(`API_ADMIN_ROOM_ID_GET_ERROR (ID: ${roomId}):`, error);
    return NextResponse.json(
      { message: "Error fetching room details", detail: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a room's details
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { roomId } = context.params;

  try {
    const body = (await request.json()) as Partial<UpsertRoomRequestBody>; // Partial because not all fields might be sent
    console.log(
      `API_ADMIN_ROOM_ID_PUT: Updating room ${roomId} with body:`,
      body
    );

    // --- Validation ---
    if (body.type && !Object.values(RoomType).includes(body.type)) {
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
    if (body.pricePerNight !== undefined && body.pricePerNight < 0) {
      return NextResponse.json(
        { message: "Price must be non-negative." },
        { status: 400 }
      );
    }
    if (body.maxGuests !== undefined && body.maxGuests < 1) {
      return NextResponse.json(
        { message: "Max Guests must be at least 1." },
        { status: 400 }
      );
    }

    // Check for unique room number if it's being changed
    if (body.roomNumber) {
      const existingRoomByNumber = await prisma.room.findFirst({
        where: { roomNumber: body.roomNumber, NOT: { id: roomId } },
      });
      if (existingRoomByNumber) {
        return NextResponse.json(
          { message: `Room number '${body.roomNumber}' already exists.` },
          { status: 409 }
        );
      }
    }

    // Construct update data carefully to only include provided fields
    const updateData: Prisma.RoomUpdateInput = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.roomNumber !== undefined) updateData.roomNumber = body.roomNumber;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.floor !== undefined) updateData.floor = body.floor;
    if (body.pricePerNight !== undefined)
      updateData.pricePerNight = body.pricePerNight;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl; // Allows setting to null
    if (body.imageUrls !== undefined) updateData.imageUrls = body.imageUrls;
    if (body.maxGuests !== undefined) updateData.maxGuests = body.maxGuests;
    if (body.beds !== undefined) updateData.beds = body.beds; // Allows setting to null
    if (body.bedConfiguration !== undefined)
      updateData.bedConfiguration = body.bedConfiguration; // Allows setting to null
    if (body.view !== undefined) updateData.view = body.view; // Allows setting to null
    if (body.characteristics !== undefined)
      updateData.characteristics = body.characteristics;
    if (body.sqMeters !== undefined) updateData.sqMeters = body.sqMeters; // Allows setting to null
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.rating !== undefined) updateData.rating = body.rating; // Allows setting to null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No update data provided" },
        { status: 400 }
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });
    console.log(`API_ADMIN_ROOM_ID_PUT: Room ${roomId} updated successfully.`);
    return NextResponse.json({
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error: any) {
    console.error(`API_ADMIN_ROOM_ID_PUT_ERROR (ID: ${roomId}):`, error);
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
      if (error.code === "P2025") {
        // Record to update not found
        return NextResponse.json(
          { message: "Room not found for update." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error updating room", detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a room
export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { roomId } = context.params;
  console.log(`API_ADMIN_ROOM_ID_DELETE: Attempting to delete room ${roomId}`);

  try {
    // CRITICAL: Check if the room has any associated active or future reservations
    // You might want to prevent deletion if it does, or handle it gracefully.
    const activeReservationsCount = await prisma.reservation.count({
      where: {
        rooms: { some: { id: roomId } },
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
        // You might also check if checkOut date is in the future
      },
    });

    if (activeReservationsCount > 0) {
      console.log(
        `API_ADMIN_ROOM_ID_DELETE: Room ${roomId} has active/future reservations. Deletion prevented.`
      );
      return NextResponse.json(
        {
          message: `Cannot delete room. It has ${activeReservationsCount} active or upcoming reservation(s). Please cancel or reassign them first.`,
        },
        { status: 409 }
      ); // Conflict
    }

    // If no active reservations, proceed with deletion
    // Note: Prisma's default behavior for relation "ReservationRooms" needs to be considered.
    // If it's a many-to-many, deleting the room might just remove it from the join table.
    // You might need to explicitly disconnect it from past reservations if your schema requires it
    // or if you want to keep reservation records intact but without this specific room.
    // For a clean delete where room is removed from past reservations:
    // await prisma.reservation.updateMany({
    //   where: { rooms: { some: { id: roomId } } },
    //   data: { rooms: { disconnect: { id: roomId } } }
    // });

    await prisma.room.delete({
      where: { id: roomId },
    });
    console.log(
      `API_ADMIN_ROOM_ID_DELETE: Room ${roomId} deleted successfully.`
    );
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error: any) {
    console.error(`API_ADMIN_ROOM_ID_DELETE_ERROR (ID: ${roomId}):`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to delete not found
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Room not found for deletion." },
          { status: 404 }
        );
      }
      // P2003: Foreign key constraint error (e.g. if reservations still link directly and onDelete is RESTRICT)
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Cannot delete room due to existing relations (e.g., past reservations). Consider archiving or dissociating first.",
            detail: error.message,
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error deleting room", detail: error.message },
      { status: 500 }
    );
  }
}
