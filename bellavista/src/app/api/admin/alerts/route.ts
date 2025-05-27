// src/app/api/admin/alerts/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, AlertType as PrismaAlertType, Prisma } from "@prisma/client";

export interface AdminAlertItem {
  id: string;
  type: PrismaAlertType;
  message: string;
  createdAt: string; // ISO String
  read: boolean;
  // Add other fields if needed from Alert model
}

// GET: Fetch alerts for admins
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
  const limit = parseInt(searchParams.get("limit") || "15"); // Default to 15 alerts per page
  const filter = searchParams.get("filter"); // 'all', 'unread'

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.AlertWhereInput = {
      forAdmin: true, // Only fetch alerts intended for admins
    };

    if (filter === "unread") {
      whereClause.read = false;
    }

    const alertsFromDb = await prisma.alert.findMany({
      where: whereClause,
      orderBy: [{ read: "asc" }, { createdAt: "desc" }], // Unread first, then newest
      skip: skip,
      take: limit,
    });

    const totalAlerts = await prisma.alert.count({ where: whereClause });

    const mappedAlerts: AdminAlertItem[] = alertsFromDb.map((alert) => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      createdAt: alert.createdAt.toISOString(),
      read: alert.read,
    }));

    return NextResponse.json({
      alerts: mappedAlerts,
      totalPages: Math.ceil(totalAlerts / limit),
      currentPage: page,
      totalAlerts,
    });
  } catch (error: any) {
    console.error("API_ADMIN_ALERTS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching alerts", detail: error.message },
      { status: 500 }
    );
  }
}

// POST: Mark all admin alerts as read
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Assuming a POST to this route without a specific ID means "mark all unread as read"
    await prisma.alert.updateMany({
      where: {
        forAdmin: true,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      message: "All unread admin alerts marked as read.",
    });
  } catch (error: any) {
    console.error("API_ADMIN_ALERTS_MARK_ALL_READ_ERROR:", error);
    return NextResponse.json(
      { message: "Error marking all alerts as read", detail: error.message },
      { status: 500 }
    );
  }
}
