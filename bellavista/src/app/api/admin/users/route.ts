// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client"; // Import Role enum
import bcrypt from "bcryptjs";

// Interface for creating a new user (if admin can create users)
interface CreateUserRequestBody {
  email: string;
  name: string;
  password?: string; // Optional if you send a welcome email with a set password link
  role: Role; // CLIENT, AGENT, ADMIN
  phone?: string;
  isEmailVerified?: boolean;
}

// GET: Fetch all users with pagination and optional search/filter
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const searchQuery = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") as Role | null;

  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.UserWhereInput = {};
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
      ];
    }
    if (roleFilter && Object.values(Role).includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        // Select only necessary fields for the list view
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        phone: true,
        // Do not select password
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers,
    });
  } catch (error: any) {
    console.error("API_ADMIN_USERS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching users", detail: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new user (optional - admins might use a different flow)
export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized to create user" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as CreateUserRequestBody;
    const {
      email,
      name,
      password,
      role,
      phone,
      isEmailVerified = false,
    } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { message: "Email, name, and role are required" },
        { status: 400 }
      );
    }
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      ); // Conflict
    }

    // Password handling: If not provided, you might want a flow for user to set it.
    // For admin creation, providing a temporary one or requiring it is common.
    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password is required and must be at least 6 characters" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        phone,
        isEmailVerified,
        // You might want to create a ClientProfile or Agent/Admin record here too if role requires it
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }, // Don't return password
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_ADMIN_USERS_POST_ERROR:", error);
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
      { message: "Error creating user", detail: error.message },
      { status: 500 }
    );
  }
}
