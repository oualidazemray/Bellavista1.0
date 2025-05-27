// src/app/api/client/reservations/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  ReservationStatus as PrismaReservationStatus,
  Prisma,
  RoomType as PrismaRoomType,
} from "@prisma/client";

type ReservationStatusFilter = "all" | "upcoming" | "completed" | "cancelled";
type MappedReservationStatus = "upcoming" | "completed" | "cancelled";

export interface ApiReservationListItem {
  id: string;
  hotelName: string;
  hotelImageUrl?: string | null;
  hotelImageAlt?: string | null;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: MappedReservationStatus;
  bookingDate: string;
  feedbackGiven?: boolean;
  canCancel?: boolean;
  canEdit?: boolean;
}

export async function GET(request: NextRequest) {
  console.log("API_RESERVATIONS_GET (List): Handler started.");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || !token.id || token.role !== "CLIENT") {
    console.log("API_RESERVATIONS_GET (List): Unauthorized.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;
  console.log(`API_RESERVATIONS_GET (List): Authorized for user ID: ${userId}`);

  const { searchParams } = new URL(request.url);
  const statusFilterParam = searchParams.get(
    "status"
  ) as ReservationStatusFilter | null;
  console.log(
    "API_RESERVATIONS_GET (List): Received statusFilterParam from URL:",
    statusFilterParam
  );

  try {
    const whereClause: Prisma.ReservationWhereInput = { clientId: userId };

    if (statusFilterParam && statusFilterParam !== "all") {
      console.log(
        "API_RESERVATIONS_GET (List): Applying specific status filter:",
        statusFilterParam
      );
      if (statusFilterParam === "upcoming") {
        whereClause.AND = [
          {
            status: {
              in: [
                PrismaReservationStatus.PENDING,
                PrismaReservationStatus.CONFIRMED,
              ],
            },
          },
          { checkIn: { gte: new Date() } },
        ];
      } else if (statusFilterParam === "completed") {
        whereClause.OR = [
          {
            status: {
              in: [
                PrismaReservationStatus.CHECKED_OUT,
                PrismaReservationStatus.COMPLETED,
              ],
            },
          },
          {
            status: {
              in: [
                PrismaReservationStatus.PENDING,
                PrismaReservationStatus.CONFIRMED,
              ],
            },
            checkOut: { lt: new Date() },
          },
        ];
      } else if (statusFilterParam === "cancelled") {
        whereClause.status = PrismaReservationStatus.CANCELED;
      }
    } else {
      // This block executes if statusFilterParam is "all" or null/undefined
      console.log(
        "API_RESERVATIONS_GET (List): No specific status filter applied or 'all' selected. Fetching all for user."
      );
      // No additional status conditions needed for 'whereClause', it's already { clientId: userId }
    }

    console.log(
      "API_RESERVATIONS_GET (List): Final Prisma whereClause:",
      JSON.stringify(whereClause, null, 2)
    );

    const reservationsFromDb = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        rooms: { select: { name: true, type: true, imageUrl: true }, take: 1 },
        feedbacks: { where: { userId: userId }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      `API_RESERVATIONS_GET (List): Fetched ${reservationsFromDb.length} reservations from DB for user ${userId} with current filter.`
    );

    const now = new Date();
    const mappedReservations: ApiReservationListItem[] = reservationsFromDb.map(
      (res) => {
        const firstRoom =
          res.rooms && res.rooms.length > 0 ? res.rooms[0] : null;
        let displayStatus: MappedReservationStatus;

        if (res.status === PrismaReservationStatus.CANCELED)
          displayStatus = "cancelled";
        else if (
          res.status === PrismaReservationStatus.CHECKED_OUT ||
          res.status === PrismaReservationStatus.COMPLETED
        )
          displayStatus = "completed";
        else if (
          (res.status === PrismaReservationStatus.CONFIRMED ||
            res.status === PrismaReservationStatus.PENDING) &&
          res.checkIn >= now
        )
          displayStatus = "upcoming";
        else displayStatus = "completed";

        const isUpcomingAndPotentiallyActionable =
          (res.status === PrismaReservationStatus.CONFIRMED ||
            res.status === PrismaReservationStatus.PENDING) &&
          res.checkIn > now;
        const daysUntilCheckIn = isUpcomingAndPotentiallyActionable
          ? (res.checkIn.getTime() - now.getTime()) / (1000 * 3600 * 24)
          : 0;

        return {
          id: res.id,
          hotelName: firstRoom?.name || "Hotel Bellavista",
          hotelImageUrl: firstRoom?.imageUrl || null,
          hotelImageAlt: `Image of ${firstRoom?.name || "Hotel Bellavista"}`,
          roomType: firstRoom?.type
            ? PrismaRoomType[firstRoom.type]
            : "Unknown Room",
          checkInDate: res.checkIn.toISOString(),
          checkOutDate: res.checkOut.toISOString(),
          numberOfGuests: res.numAdults + (res.numChildren || 0),
          totalPrice: res.totalPrice,
          status: displayStatus,
          bookingDate: res.createdAt.toISOString(),
          feedbackGiven: res.feedbacks.length > 0,
          canEdit:
            res.status === PrismaReservationStatus.CONFIRMED &&
            isUpcomingAndPotentiallyActionable &&
            daysUntilCheckIn > 2,
          canCancel: isUpcomingAndPotentiallyActionable && daysUntilCheckIn > 7,
        };
      }
    );
    console.log(
      "API_RESERVATIONS_GET (List): Sending mapped reservations count:",
      mappedReservations.length
    );
    return NextResponse.json(mappedReservations);
  } catch (error: any) {
    console.error("API_RESERVATIONS_GET_ERROR (List):", error);
    return NextResponse.json(
      { message: "Error fetching reservations", detail: error.message },
      { status: 500 }
    );
  }
}
