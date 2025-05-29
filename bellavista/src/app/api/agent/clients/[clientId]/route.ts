// src/app/api/agent/clients/[clientId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, Prisma } from "@prisma/client";

interface RouteContext {
  params: {
    clientId: string;
  };
}

// For PUT request
interface UpdateClientRequestBody {
  name?: string;
  email?: string; // Handle with care due to uniqueness and verification
  phone?: string;
  isEmailVerified?: boolean;
  taxId?: string; // From ClientProfile
  bio?: string; // From User model
  profileImageUrl?: string; // From User model
}

// GET: Fetch details of a single client
export async function GET(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { clientId } = context.params;

  try {
    const client = await prisma.user.findUnique({
      where: { id: clientId, role: Role.CLIENT }, // Ensure it's a client
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profileImageUrl: true,
        bio: true,
        profile: { select: { taxId: true } },
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );
    }
    // Map to a flat structure for easier frontend consumption if needed
    const clientData = {
      ...client,
      taxId: client.profile?.taxId,
    };
    delete (clientData as any).profile; // Remove nested profile

    return NextResponse.json(clientData);
  } catch (error: any) {
    console.error(`API_AGENT_CLIENT_ID_GET_ERROR (ID: ${clientId}):`, error);
    return NextResponse.json(
      { message: "Error fetching client details", detail: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a client's details
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { clientId } = context.params;

  try {
    const body = (await request.json()) as UpdateClientRequestBody;
    const { name, email, phone, isEmailVerified, taxId, bio, profileImageUrl } =
      body;

    const userDataToUpdate: Prisma.UserUpdateInput = {};
    if (name !== undefined) userDataToUpdate.name = name;
    if (phone !== undefined) userDataToUpdate.phone = phone;
    if (isEmailVerified !== undefined)
      userDataToUpdate.isEmailVerified = isEmailVerified;
    if (bio !== undefined) userDataToUpdate.bio = bio;
    if (profileImageUrl !== undefined)
      userDataToUpdate.profileImageUrl = profileImageUrl;

    // Handle email change carefully
    if (email) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: { email: email, NOT: { id: clientId } },
      });
      if (existingUserWithEmail) {
        return NextResponse.json(
          { message: "Email already in use by another account." },
          { status: 409 }
        );
      }
      userDataToUpdate.email = email;
      // If email changes, typically set isEmailVerified to false and trigger re-verification
      // userDataToUpdate.isEmailVerified = false;
    }

    const clientProfileDataToUpdate: Prisma.ClientProfileUpdateInput = {};
    if (taxId !== undefined) clientProfileDataToUpdate.taxId = taxId;

    const [updatedUser, updatedClientProfile] = await prisma.$transaction(
      async (tx) => {
        let userRes = null;
        if (Object.keys(userDataToUpdate).length > 0) {
          userRes = await tx.user.update({
            where: { id: clientId, role: Role.CLIENT },
            data: userDataToUpdate,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isEmailVerified: true,
              bio: true,
              profileImageUrl: true,
            },
          });
        } else {
          userRes = await tx.user.findUniqueOrThrow({
            where: { id: clientId, role: Role.CLIENT },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isEmailVerified: true,
              bio: true,
              profileImageUrl: true,
            },
          });
        }

        let profileRes = null;
        if (
          Object.keys(clientProfileDataToUpdate).length > 0 ||
          (await tx.clientProfile.count({ where: { userId: clientId } })) === 0
        ) {
          profileRes = await tx.clientProfile.upsert({
            where: { userId: clientId },
            update: clientProfileDataToUpdate,
            create: { userId: clientId, ...clientProfileDataToUpdate },
            select: { taxId: true },
          });
        } else {
          profileRes = await tx.clientProfile.findUnique({
            where: { userId: clientId },
            select: { taxId: true },
          });
        }
        return [userRes, profileRes];
      }
    );

    const responseData = {
      ...updatedUser,
      taxId: updatedClientProfile?.taxId,
    };

    return NextResponse.json({
      message: "Client profile updated successfully",
      user: responseData,
    });
  } catch (error: any) {
    console.error(`API_AGENT_CLIENT_ID_PUT_ERROR (ID: ${clientId}):`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return NextResponse.json(
          { message: "Email already in use." },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        // Record to update not found
        return NextResponse.json(
          { message: "Client not found for update." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error updating client profile", detail: error.message },
      { status: 500 }
    );
  }
}
