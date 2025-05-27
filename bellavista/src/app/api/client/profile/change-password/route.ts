// src/app/api/client/profile/change-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

interface ChangePasswordRequestBody {
  currentPassword?: string;
  newPassword?: string;
}

export async function POST(request: NextRequest) {
  console.log("CHANGE_PASSWORD_API: POST request received"); // Add log
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== "CLIENT") {
    console.log("CHANGE_PASSWORD_API: Unauthorized access attempt.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;
  console.log(`CHANGE_PASSWORD_API: Authorized for user ID: ${userId}`);

  try {
    const body = (await request.json()) as ChangePasswordRequestBody;
    console.log("CHANGE_PASSWORD_API: Request body:", body);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      console.log("CHANGE_PASSWORD_API: Missing current or new password.");
      return NextResponse.json(
        { message: "Current and new passwords are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.log("CHANGE_PASSWORD_API: New password too short.");
      return NextResponse.json(
        { message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("CHANGE_PASSWORD_API: User not found in DB.");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    console.log("CHANGE_PASSWORD_API: User found in DB.");

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      console.log("CHANGE_PASSWORD_API: Incorrect current password.");
      return NextResponse.json(
        { message: "Incorrect current password" },
        { status: 400 }
      );
    }
    console.log("CHANGE_PASSWORD_API: Current password is valid.");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    console.log("CHANGE_PASSWORD_API: New password hashed.");

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    console.log("CHANGE_PASSWORD_API: User password updated in DB.");

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    // Catch specific errors if possible, e.g., JSON.parse error
    console.error("API_CHANGE_PASSWORD_ERROR:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        message: "Error changing password",
        detail: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Add a basic GET handler to avoid the 405 if something accidentally calls it,
// though it shouldn't be used by your form.
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "Method Not Allowed. Use POST to change password." },
    { status: 405 }
  );
}
