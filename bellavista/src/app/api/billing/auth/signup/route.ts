// File: app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, verifyPassword } =
      await req.json();

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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`, // 🔧 Combine names into single field
        phone: phone || null,
        role: "CLIENT", // 🔧 Provide default role
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
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
