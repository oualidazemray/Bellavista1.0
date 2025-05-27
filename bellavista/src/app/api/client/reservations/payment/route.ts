// src/app/api/client/reservations/payment/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  ReservationStatus as PrismaReservationStatus,
  Prisma,
} from "@prisma/client";

// Interface for the request body when creating/confirming a reservation via this endpoint
interface ConfirmReservationApiBody {
  bookingItems: Array<{
    roomId: string;
    arrivalDate: string; // ISO string expected from client (YYYY-MM-DDTHH:mm:ss.sssZ)
    departureDate: string; // ISO string
    nights: number;
    adults: number;
    children: number;
    pricePerNight: number;
    itemTotalPrice: number;
  }>;
  totalPrice: number; // Grand total from client (for verification)
  currency: string;
  // paymentDetails might be included for logging or future use, even if mocked now
  paymentDetails?: {
    status?: string; // e.g., "mock_paid"
    method?: string; // e.g., "Simulated Payment"
  };
  promoCodeUsed?: string;
}

export async function POST(request: NextRequest) {
  console.log("API_RESERVATION_PAYMENT_POST: Handler started.");
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== "CLIENT") {
    console.log("API_RESERVATION_PAYMENT_POST: Unauthorized.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const clientId = token.id as string;
  console.log(
    `API_RESERVATION_PAYMENT_POST: Authorized for client ID: ${clientId}`
  );

  try {
    const body = (await request.json()) as ConfirmReservationApiBody;
    console.log(
      "API_RESERVATION_PAYMENT_POST: Request body:",
      JSON.stringify(body, null, 2)
    );

    const {
      bookingItems,
      totalPrice: clientCalculatedTotalPrice,
      currency,
      paymentDetails,
      promoCodeUsed,
    } = body;

    if (!bookingItems || bookingItems.length === 0) {
      return NextResponse.json(
        { message: "Missing required booking items." },
        { status: 400 }
      );
    }
    // No real payment token to check here for this simulated flow

    // --- SERVER-SIDE VALIDATION AND CALCULATION ---
    let serverCalculatedSubtotal = 0;
    const roomIdsToBook: string[] = [];
    // Determine overall checkIn/checkOut from the bookingItems
    // This assumes all items in a single "booking cart" are for the same overall stay period.
    // If not, this logic needs adjustment or each item becomes a separate reservation.
    if (bookingItems.length === 0) {
      return NextResponse.json(
        { message: "No items to book." },
        { status: 400 }
      );
    }
    const earliestCheckIn = new Date(bookingItems[0].arrivalDate); // Already ISO strings from client
    const latestCheckOut = new Date(bookingItems[0].departureDate); // Already ISO strings

    let totalAdults = 0;
    let totalChildren = 0;

    for (const item of bookingItems) {
      const room = await prisma.room.findUnique({ where: { id: item.roomId } });
      if (!room) {
        throw new Error(
          `Room with ID ${item.roomId} not found during booking confirmation.`
        );
      }

      // CRITICAL: Re-verify Room Availability for item.arrivalDate & item.departureDate for item.roomId
      // This check ensures no double booking since items were added to cart.
      const itemCheckInDate = new Date(item.arrivalDate);
      const itemCheckOutDate = new Date(item.departureDate);

      const conflictingReservations = await prisma.reservation.count({
        where: {
          status: {
            in: [
              PrismaReservationStatus.CONFIRMED,
              PrismaReservationStatus.PENDING,
            ],
          },
          rooms: { some: { id: item.roomId } },
          AND: [
            { checkIn: { lt: itemCheckOutDate } },
            { checkOut: { gt: itemCheckInDate } },
          ],
        },
      });
      if (conflictingReservations > 0) {
        return NextResponse.json(
          {
            message: `Room ${room.name} is no longer available for the selected dates. Please remove it from your cart and try again.`,
          },
          { status: 409 }
        ); // 409 Conflict
      }
      // --- End Availability Re-check ---

      totalAdults += item.adults;
      totalChildren += item.children || 0;

      const nights = Math.max(
        1,
        Math.ceil(
          (itemCheckOutDate.getTime() - itemCheckInDate.getTime()) /
            (1000 * 3600 * 24)
        )
      );
      if (nights !== item.nights) {
        console.warn(
          `API_RESERVATION_PAYMENT_POST: Nights mismatch for room ${item.roomId}. Client: ${item.nights}, Server: ${nights}`
        );
        // Potentially throw error or use server calculated nights
      }
      serverCalculatedSubtotal += room.pricePerNight * nights;
      roomIdsToBook.push(item.roomId);
    }

    // TODO: Implement your actual tax calculation logic
    const serverCalculatedTaxes = bookingItems.reduce(
      (acc, item) => acc + (item.itemTax || 0),
      0
    ); // Sum taxes from cart if provided, or recalculate
    const serverCalculatedGrandTotal =
      serverCalculatedSubtotal + serverCalculatedTaxes;

    if (
      Math.abs(
        parseFloat(clientCalculatedTotalPrice.toString()) -
          serverCalculatedGrandTotal
      ) > 0.01
    ) {
      console.warn(
        `API_RESERVATION_PAYMENT_POST: Price mismatch. Client: ${clientCalculatedTotalPrice}, Server: ${serverCalculatedGrandTotal}`
      );
      // return NextResponse.json({ message: "Price discrepancy detected. Please refresh your cart and try again." }, { status: 409 });
    }

    // --- SIMULATED PAYMENT SUCCESS ---
    console.log(
      "API_RESERVATION_PAYMENT_POST: Payment simulated as successful. Payment Details received:",
      paymentDetails
    );

    // --- Create Reservation in Database ---
    const newReservation = await prisma.reservation.create({
      data: {
        clientId: clientId,
        checkIn: earliestCheckIn,
        checkOut: latestCheckOut,
        numAdults: totalAdults,
        numChildren: totalChildren,
        totalPrice: serverCalculatedGrandTotal, // Use server-calculated price
        status: PrismaReservationStatus.CONFIRMED, // Directly confirm
        promoCodeUsed: promoCodeUsed,
        rooms: {
          connect: roomIdsToBook.map((id) => ({ id })),
        },
        sourceLog: {
          // Example of creating a related log for reservation source
          create: { source: "WEB" }, // Assuming 'WEB' is a value in your ReservationSource enum
        },
      },
      include: {
        // Include rooms in the response for confirmation
        rooms: { select: { id: true, name: true, type: true } },
      },
    });
    console.log(
      "API_RESERVATION_PAYMENT_POST: New reservation created:",
      newReservation.id
    );

    // TODO: Send confirmation email/notification to the client
    // TODO: Notify hotel staff/admin if necessary
    // TODO: Invalidate relevant caches (e.g., room availability)

    return NextResponse.json(
      {
        message: "Reservation successfully confirmed!",
        reservation: newReservation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_RESERVATION_PAYMENT_POST_ERROR:", error);
    return NextResponse.json(
      { message: "Error creating reservation", detail: error.message },
      { status: 500 }
    );
  }
}
