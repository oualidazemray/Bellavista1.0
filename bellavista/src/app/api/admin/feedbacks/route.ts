// src/app/api/admin/feedbacks/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client";

// Interface for data returned for each feedback item in the list
export interface AdminFeedbackItem {
  id: string;
  userName: string; // Name of the user who gave feedback
  userEmail: string;
  reservationId: string;
  hotelName?: string; // Name of the hotel/room for the reservation
  rating: number;
  message: string;
  createdAt: string; // ISO String
  // photoUrl?: string | null; // If you store photos with feedback
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json(
      { message: "Unauthorized: Admin role required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || ""; // Search by user name/email, reservation ID, or message content
  const ratingFilter = searchParams.get("rating"); // e.g., "5", "4"
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.FeedbackWhereInput = {};
    const conditions: Prisma.FeedbackWhereInput[] = [];

    if (searchQuery) {
      conditions.push({
        OR: [
          { user: { name: { contains: searchQuery, mode: "insensitive" } } },
          { user: { email: { contains: searchQuery, mode: "insensitive" } } },
          { reservationId: { contains: searchQuery, mode: "insensitive" } },
          { message: { contains: searchQuery, mode: "insensitive" } },
          // You could also search by hotel/room name if that data is easily joinable or denormalized
        ],
      });
    }

    if (ratingFilter) {
      const rating = parseInt(ratingFilter, 10);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        conditions.push({ rating: rating });
      }
    }

    if (startDate) {
      conditions.push({ createdAt: { gte: new Date(startDate) } });
    }
    if (endDate) {
      // To include the whole end day, set time to end of day or use '<' with next day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push({ createdAt: { lte: endOfDay } });
    }

    if (conditions.length > 0) {
      whereClause.AND = conditions;
    }

    const feedbacksFromDb = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } }, // Get user's name and email
        reservation: {
          // Get reservation details for context
          select: {
            id: true,
            // To get hotelName, you'd need to include rooms and then the first room's name
            // or if reservation directly stores hotelName
            rooms: {
              select: { name: true }, // Assuming room name can serve as hotel context
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const totalFeedbacks = await prisma.feedback.count({ where: whereClause });

    const mappedFeedbacks: AdminFeedbackItem[] = feedbacksFromDb.map((fb) => ({
      id: fb.id,
      userName: fb.user.name,
      userEmail: fb.user.email,
      reservationId: fb.reservationId,
      hotelName:
        fb.reservation.rooms.length > 0
          ? fb.reservation.rooms[0].name.split(" - ")[0]
          : "N/A", // Simplified
      rating: fb.rating,
      message: fb.message,
      createdAt: fb.createdAt.toISOString(),
      // photoUrl: fb.photoUrl,
    }));

    return NextResponse.json({
      feedbacks: mappedFeedbacks,
      totalPages: Math.ceil(totalFeedbacks / limit),
      currentPage: page,
      totalFeedbacks,
    });
  } catch (error: any) {
    console.error("API_ADMIN_FEEDBACKS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching feedbacks", detail: error.message },
      { status: 500 }
    );
  }
}

// Optional: DELETE handler to remove feedback (use with caution)
export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feedbackId = searchParams.get("id");

  if (!feedbackId) {
    return NextResponse.json(
      { message: "Feedback ID is required for deletion." },
      { status: 400 }
    );
  }

  try {
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });
    return NextResponse.json({ message: "Feedback deleted successfully." });
  } catch (error: any) {
    console.error(
      `API_ADMIN_FEEDBACK_DELETE_ERROR (ID: ${feedbackId}):`,
      error
    );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Feedback not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Error deleting feedback", detail: error.message },
      { status: 500 }
    );
  }
}
