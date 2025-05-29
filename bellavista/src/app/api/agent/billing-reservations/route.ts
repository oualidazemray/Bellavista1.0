// src/app/api/agent/billing-reservations/route.ts
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

export interface BillableReservationItem {
  id: string; // Reservation ID
  clientName: string;
  clientEmail: string;
  roomNames: string[];
  checkIn: string; // ISO
  checkOut: string; // ISO
  totalPrice: number;
  status: PrismaReservationStatus;
  bookingDate: string; // ISO
  invoiceId?: string | null; // ID of the existing invoice
  invoiceFileUrl?: string | null; // URL of the existing invoice
  invoiceSentByEmail?: boolean | null;
}

interface FetchBillableReservationsResponse {
  reservations: BillableReservationItem[];
  totalPages: number;
  currentPage: number;
  totalReservations: number;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    // Or ADMIN if admins also do billing
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || ""; // Search client name, email, reservation ID
  const filterInvoiced = searchParams.get("invoiced"); // "yes", "no", or "" for all

  const skip = (page - 1) * limit;

  try {
    const whereConditions: Prisma.ReservationWhereInput[] = [
      {
        status: {
          in: [
            PrismaReservationStatus.CHECKED_OUT,
            PrismaReservationStatus.COMPLETED,
          ],
        },
      },
    ];

    if (searchQuery) {
      whereConditions.push({
        OR: [
          { client: { name: { contains: searchQuery, mode: "insensitive" } } },
          { client: { email: { contains: searchQuery, mode: "insensitive" } } },
          { id: { contains: searchQuery, mode: "insensitive" } },
        ],
      });
    }

    if (filterInvoiced === "yes") {
      whereConditions.push({ invoices: { some: {} } }); // Has at least one invoice
    } else if (filterInvoiced === "no") {
      whereConditions.push({ invoices: { none: {} } }); // Has no invoices
    }

    const finalWhereClause: Prisma.ReservationWhereInput = {
      AND: whereConditions,
    };

    const reservationsFromDb = await prisma.reservation.findMany({
      where: finalWhereClause,
      include: {
        client: { select: { name: true, email: true } },
        rooms: { select: { name: true, type: true }, take: 1 },
        invoices: {
          // Include the invoice if it exists
          select: { id: true, fileUrl: true, sentByEmail: true },
          take: 1, // Since reservationId is unique on Invoice, there's at most one
        },
      },
      orderBy: { checkOut: "desc" }, // Show most recent check-outs first
      skip: skip,
      take: limit,
    });

    const totalCount = await prisma.reservation.count({
      where: finalWhereClause,
    });

    const mappedData: BillableReservationItem[] = reservationsFromDb.map(
      (res) => {
        const firstRoom = res.rooms.length > 0 ? res.rooms[0] : null;
        const invoice = res.invoices.length > 0 ? res.invoices[0] : null;
        return {
          id: res.id,
          clientName: res.client.name,
          clientEmail: res.client.email,
          roomNames: res.rooms.map((r) => r.name || PrismaRoomType[r.type]),
          checkIn: res.checkIn.toISOString(),
          checkOut: res.checkOut.toISOString(),
          numberOfGuests: res.numAdults + (res.numChildren || 0), // You might need to add this to select if needed
          totalPrice: res.totalPrice,
          bookingDate: res.createdAt.toISOString(),
          status: res.status,
          invoiceId: invoice?.id,
          invoiceFileUrl: invoice?.fileUrl,
          invoiceSentByEmail: invoice?.sentByEmail,
        };
      }
    );

    return NextResponse.json({
      reservations: mappedData,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalReservations: totalCount,
    });
  } catch (error: any) {
    console.error("API_AGENT_BILLING_RESERVATIONS_GET_ERROR:", error);
    return NextResponse.json(
      {
        message: "Error fetching billable reservations",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
