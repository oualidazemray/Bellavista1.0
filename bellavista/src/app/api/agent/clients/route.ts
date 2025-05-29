// src/app/api/agent/clients/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// Interface for client data in the list
export interface AgentClientListItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified: boolean;
  createdAt: string; // ISO string
  // Potentially add lastBookingDate or totalBookings if useful for agent
}

interface FetchClientsResponse {
  clients: AgentClientListItem[];
  totalPages: number;
  currentPage: number;
  totalClients: number;
}

// Interface for creating a new client by an agent
interface AgentCreateClientBody {
  name: string;
  email: string;
  phone?: string;
  // Password will be temporary, user should be prompted to change it
  // isEmailVerified can be set by agent if they verify in person/phone
  isEmailVerified?: boolean;
  // taxId?: string; // If agent can set ClientProfile details
}

// GET: Fetch all CLIENT users with pagination and search
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    // Can also be ADMIN if they share this view
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || "";
  // Add other filters like isEmailVerified if needed

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.UserWhereInput = {
      role: Role.CLIENT, // Only fetch clients
    };
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { phone: { contains: searchQuery, mode: "insensitive" } }, // Search by phone too
      ];
    }
    // Example filter for email verification status
    // const verifiedFilter = searchParams.get('verified');
    // if (verifiedFilter === 'true') whereClause.isEmailVerified = true;
    // if (verifiedFilter === 'false') whereClause.isEmailVerified = false;

    const clients = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const totalClients = await prisma.user.count({ where: whereClause });

    const mappedClients: AgentClientListItem[] = clients.map((client) => ({
      ...client,
      createdAt: client.createdAt.toISOString(),
    }));

    return NextResponse.json({
      clients: mappedClients,
      totalPages: Math.ceil(totalClients / limit),
      currentPage: page,
      totalClients,
    });
  } catch (error: any) {
    console.error("API_AGENT_CLIENTS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching clients", detail: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new CLIENT user by an Agent
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json(
      { message: "Unauthorized to create client" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as AgentCreateClientBody;
    const { name, email, phone, isEmailVerified = false } = body;

    if (!email || !name) {
      return NextResponse.json(
        { message: "Email and name are required for new client." },
        { status: 400 }
      );
    }
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: `User with email ${email} already exists.` },
        { status: 409 }
      );
    }

    // Create a strong temporary password or implement a "set password via link" flow
    const tempPassword = `ClientPass!${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    console.log(
      `AGENT_CREATE_CLIENT: New client temp password (for dev only, REMOVE LOG): ${tempPassword}`
    );

    const newClient = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: Role.CLIENT, // New users created by agents are CLIENTS
        phone,
        isEmailVerified, // Agent can mark as verified if done in person/phone
        profile: {
          // Automatically create an empty ClientProfile
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
        phone: true,
      },
    });

    // TODO: Trigger a welcome email with instructions to set a permanent password
    // and verify email if not already marked as verified.

    return NextResponse.json(
      {
        message:
          "Client account created successfully. Client should set their password.",
        user: newClient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_AGENT_CLIENTS_POST_ERROR:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating client account", detail: error.message },
      { status: 500 }
    );
  }
}
