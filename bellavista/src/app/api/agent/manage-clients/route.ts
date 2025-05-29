// src/app/api/agent/manage-clients/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// Interface for client data in the list returned to agent
export interface AgentViewClientListItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified: boolean;
  createdAt: string; // ISO string
}

interface FetchClientsResponse {
  clients: AgentViewClientListItem[];
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
  isEmailVerified?: boolean; // Agent might verify in person
  // taxId?: string; // ClientProfile data can be added here too
}

// GET: Fetch all CLIENT users with pagination and search
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json(
      { message: "Unauthorized: Agent role required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.UserWhereInput = {
      role: Role.CLIENT, // <<< CRUCIAL: Only fetch users with CLIENT role
    };
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { phone: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

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

    const mappedClients: AgentViewClientListItem[] = clients.map((client) => ({
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
    console.error("API_AGENT_MANAGE_CLIENTS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching client accounts", detail: error.message },
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
      { message: "Unauthorized to create client account" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as AgentCreateClientBody;
    const { name, email, phone, isEmailVerified = false } = body; // Default isEmailVerified to false

    if (!email || !name) {
      return NextResponse.json(
        { message: "Email and name are required for the new client." },
        { status: 400 }
      );
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      // Basic email format validation
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: `A user with email ${email} already exists.` },
        { status: 409 }
      ); // Conflict
    }

    // Create a strong temporary password for the new client.
    // The client should be forced to change this on their first login.
    const tempPassword = `ClientPass_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    console.log(
      `AGENT_CREATE_CLIENT: New client temp password (for dev log only, REMOVE IN PROD): ${tempPassword}`
    );

    const newClient = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(), // Normalize email
        name: name.trim(),
        password: hashedPassword,
        role: Role.CLIENT, // <<< CRUCIAL: Agent can ONLY create CLIENT role users
        phone: phone?.trim() || null,
        isEmailVerified: isEmailVerified,
        profile: {
          // Automatically create an empty ClientProfile
          create: {
            // taxId: body.taxId // If agents can set taxId during creation
          },
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

    // TODO: Trigger a welcome email to the new client with the temporary password (or a reset link)
    // and instructions to set their permanent password.

    return NextResponse.json(
      {
        message:
          "Client account created successfully. Client should be advised to set their password.",
        user: newClient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_AGENT_MANAGE_CLIENTS_POST_ERROR:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // This usually means unique constraint failed (e.g., email already exists)
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating client account", detail: error.message },
      { status: 500 }
    );
  }
}
