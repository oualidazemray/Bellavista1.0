// src/app/api/client/reservations/[reservationId]/feedback/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { ReservationStatus } from "@prisma/client";

interface RouteContext {
  params: {
    reservationId: string; // This comes from the [reservationId] in the path
  };
}

interface FeedbackRequestBody {
  rating?: number;
  comment?: string;
  // photoUrl?: string; // If you add photo uploads for feedback
}

export async function POST(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params; // Get reservationId from the URL path

  if (!token || !token.id || token.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;

  console.log(
    `API_RESERVATION_FEEDBACK_POST: User ${userId} submitting feedback for Res ID: ${reservationId}`
  );

  try {
    const body = (await request.json()) as FeedbackRequestBody;
    const { rating, comment } = body;
    console.log("API_RESERVATION_FEEDBACK_POST: Received body:", body);

    // --- Validation ---
    if (
      rating === undefined ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { message: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }
    if (
      comment === undefined ||
      typeof comment !== "string" ||
      comment.trim() === ""
    ) {
      // If comment is optional, adjust this. Assuming it's required with a rating for now.
      return NextResponse.json(
        { message: "A comment is required with your feedback." },
        { status: 400 }
      );
    }

    // --- Verify Reservation ---
    // Ensure the reservation exists, belongs to the user, and is in a state that allows feedback
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId, // Use reservationId from URL params
        clientId: userId,
        status: {
          in: [ReservationStatus.COMPLETED, ReservationStatus.CHECKED_OUT],
        },
      },
    });

    if (!reservation) {
      console.log(
        `API_RESERVATION_FEEDBACK_POST: Valid reservation (ID: ${reservationId}) not found for user ${userId} or status not eligible for feedback.`
      );
      return NextResponse.json(
        {
          message:
            "Reservation not found, does not belong to you, or is not eligible for feedback.",
        },
        { status: 404 }
      );
    }

    // --- Check for Existing Feedback (using the unique constraint) ---
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        user_reservation_feedback: {
          // This must match the name of your @@unique constraint in Prisma schema
          userId: userId,
          reservationId: reservationId, // Use reservationId from URL params
        },
      },
    });

    if (existingFeedback) {
      console.log(
        `API_RESERVATION_FEEDBACK_POST: Feedback already submitted by user ${userId} for reservation ${reservationId}.`
      );
      return NextResponse.json(
        {
          message: "Feedback has already been submitted for this reservation.",
        },
        { status: 409 }
      ); // 409 Conflict
    }

    // --- Create Feedback ---
    const newFeedback = await prisma.feedback.create({
      data: {
        userId: userId,
        reservationId: reservationId, // Use reservationId from URL params
        rating: rating,
        message: comment.trim(),
        // photoUrl: body.photoUrl, // If you implement photo uploads
      },
    });
    console.log(
      `API_RESERVATION_FEEDBACK_POST: Feedback created successfully (ID: ${newFeedback.id}) for reservation ${reservationId}.`
    );

    return NextResponse.json(
      {
        message: "Feedback submitted successfully!",
        feedbackId: newFeedback.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      `API_RESERVATION_FEEDBACK_POST_ERROR (Res ID: ${reservationId}):`,
      error
    );
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("user_reservation_feedback")
    ) {
      return NextResponse.json(
        {
          message:
            "Feedback has already been submitted for this reservation (conflict).",
        },
        { status: 409 }
      );
    }
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      // Error parsing request body
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error submitting feedback", detail: error.message },
      { status: 500 }
    );
  }
}
