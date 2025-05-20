// File: app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { addHours } from "date-fns";
import { sendVerificationEmail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, verifyPassword } =
      await req.json();

    // Basic validations
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== verifyPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token and expiry
    const verificationToken = uuidv4();
    const tokenExpiry = addHours(new Date(), 1); // 1 hour validity

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        role: "CLIENT",
        isEmailVerified: false,
        verificationToken,
        tokenExpiry,
      },
    });
    await sendVerificationEmail(email, verificationToken);
    // TODO: Send verification email with link including token
    // e.g., `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`

    return NextResponse.json(
      { message: "User created. Please verify your email.", user: newUser },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Signup error:", err.message, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
