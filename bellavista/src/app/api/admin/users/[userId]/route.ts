// src/app/api/admin/users/[userId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client";

interface RouteContext {
  params: {
    userId: string;
  };
}

interface UpdateUserRequestBody {
  name?: string;
  email?: string; // Changing email can be complex due to uniqueness and verification
  role?: Role;
  phone?: string;
  isEmailVerified?: boolean;
  // Admin should likely not change passwords directly here without security measures
}

// GET: Fetch details of a single user
export async function GET(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { userId } = context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileImageUrl: true,
        bio: true,
        profile: { select: { taxId: true } }, // Include related ClientProfile if exists
        // Add other relations if needed for admin view (e.g., agent specific data)
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`API_ADMIN_USER_ID_GET_ERROR (ID: ${userId}):`, error);
    return NextResponse.json(
      { message: "Error fetching user details", detail: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a user's details (e.g., role, verification status)
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { userId } = context.params;

  try {
    const body = (await request.json()) as UpdateUserRequestBody;
    const { name, email, role, phone, isEmailVerified } = body;

    const updateData: Prisma.UserUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isEmailVerified !== undefined)
      updateData.isEmailVerified = isEmailVerified;
    if (role && Object.values(Role).includes(role)) {
      updateData.role = role;
    } else if (role) {
      return NextResponse.json(
        { message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Handle email change carefully due to unique constraint and verification implications
    if (email) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: { email: email, NOT: { id: userId } },
      });
      if (existingUserWithEmail) {
        return NextResponse.json(
          { message: "Email already in use by another account." },
          { status: 409 }
        );
      }
      updateData.email = email;
      // If email is changed, you might want to set isEmailVerified to false
      // and trigger a new verification flow.
      // updateData.isEmailVerified = false;
      // updateData.verificationToken = generateNewToken();
      // updateData.tokenExpiry = setNewExpiry();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No update data provided" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isEmailVerified: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error(`API_ADMIN_USER_ID_PUT_ERROR (ID: ${userId}):`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      error.meta?.target?.includes("email")
    ) {
      return NextResponse.json(
        { message: "Email already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error updating user", detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user
export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { userId } = context.params;

  // Prevent admin from deleting themselves (optional but good practice)
  if (token.id === userId) {
    return NextResponse.json(
      {
        message:
          "Admins cannot delete their own account through this endpoint.",
      },
      { status: 403 }
    );
  }

  try {
    // Consider what to do with related data (reservations, feedbacks, etc.)
    // Prisma's default is to throw an error if related records exist that would violate foreign key constraints.
    // You might need to:
    // 1. Delete related records first (e.g., feedbacks, notifications).
    // 2. Nullify foreign keys on related records if the relation is optional (e.g., Reservation.clientId if you allow orphaned reservations, though not ideal).
    // 3. Use Prisma's cascading deletes if configured in your schema (e.g., onDelete: Cascade).

    // Example: Simple delete. This will fail if there are FK constraints.
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error(`API_ADMIN_USER_ID_DELETE_ERROR (ID: ${userId}):`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2003: Foreign key constraint failed on the field: `...`
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Cannot delete user. They have related records (e.g., reservations, feedback). Please manage or reassign these records first.",
            detail: error.message,
          },
          { status: 409 }
        ); // Conflict
      }
      // P2025: An operation failed because it depends on one or more records that were required but not found. {cause}
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "User not found for deletion." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error deleting user", detail: error.message },
      { status: 500 }
    );
  }
}
