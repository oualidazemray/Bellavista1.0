// src/app/api/agent/manage-clients/[clientId]/route.ts
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

// Interface for updating a client by an agent
interface AgentUpdateClientBody {
  name?: string;
  email?: string; // Handle with care: if email changes, re-verification flow needed
  phone?: string;
  isEmailVerified?: boolean; // Agent might be able to verify
  taxId?: string; // From ClientProfile
  bio?: string;
  profileImageUrl?: string;
  // Agents should typically NOT be able to change a client's role or password directly here.
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
    const client = await prisma.user.findFirst({
      // findFirst to ensure role is CLIENT
      where: { id: clientId, role: Role.CLIENT },
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
        { message: "Client account not found or user is not a client." },
        { status: 404 }
      );
    }
    // Map to a flat structure for easier frontend consumption if needed
    const clientData = {
      ...client,
      taxId: client.profile?.taxId || null, // Ensure taxId is present or null
    };
    delete (clientData as any).profile;

    return NextResponse.json(clientData);
  } catch (error: any) {
    console.error(`API_AGENT_CLIENT_ID_GET_ERROR (ID: ${clientId}):`, error);
    return NextResponse.json(
      { message: "Error fetching client details", detail: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a client's details by an Agent
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
    const body = (await request.json()) as AgentUpdateClientBody;
    const { name, email, phone, isEmailVerified, taxId, bio, profileImageUrl } =
      body;

    // Ensure agent is updating a CLIENT account
    const existingClient = await prisma.user.findUnique({
      where: { id: clientId },
    });
    if (!existingClient || existingClient.role !== Role.CLIENT) {
      return NextResponse.json(
        { message: "Target user not found or is not a client." },
        { status: 404 }
      );
    }

    const userDataToUpdate: Prisma.UserUpdateInput = {};
    if (name !== undefined) userDataToUpdate.name = name.trim();
    if (phone !== undefined) userDataToUpdate.phone = phone.trim() || null; // Allow clearing phone
    if (isEmailVerified !== undefined)
      userDataToUpdate.isEmailVerified = isEmailVerified;
    if (bio !== undefined) userDataToUpdate.bio = bio.trim() || null;
    if (profileImageUrl !== undefined)
      userDataToUpdate.profileImageUrl = profileImageUrl.trim() || null;

    // Handle email change very carefully
    if (
      email &&
      email.trim().toLowerCase() !== existingClient.email.toLowerCase()
    ) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json(
          { message: "Invalid new email format." },
          { status: 400 }
        );
      }
      const anotherUserWithNewEmail = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase(), NOT: { id: clientId } },
      });
      if (anotherUserWithNewEmail) {
        return NextResponse.json(
          {
            message: "New email address is already in use by another account.",
          },
          { status: 409 }
        );
      }
      userDataToUpdate.email = email.trim().toLowerCase();
      // When agent changes email, it's good practice to mark it as unverified and trigger new verification
      userDataToUpdate.isEmailVerified = false;
      // TODO: Trigger email verification flow for the new email address
    }

    const clientProfileDataToUpdate: Prisma.ClientProfileUpdateInput = {};
    if (taxId !== undefined)
      clientProfileDataToUpdate.taxId = taxId.trim() || null;

    // Use a transaction for atomicity
    const [updatedUser, updatedClientProfile] = await prisma.$transaction(
      async (tx) => {
        let userRes = existingClient; // Start with existing to avoid re-fetch if no user data changes
        if (Object.keys(userDataToUpdate).length > 0) {
          userRes = await tx.user.update({
            where: { id: clientId }, // Already confirmed it's a CLIENT
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
        }

        const profileRes = await tx.clientProfile.upsert({
          where: { userId: clientId },
          update: clientProfileDataToUpdate,
          create: { userId: clientId, ...clientProfileDataToUpdate },
          select: { taxId: true },
        });
        return [userRes, profileRes];
      }
    );

    const responseData = {
      ...updatedUser,
      taxId: updatedClientProfile?.taxId,
    };
    delete (responseData as any).profile;

    return NextResponse.json({
      message: "Client profile updated successfully by agent.",
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

// DELETE: Delete a CLIENT account by an Agent (Use with extreme caution)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    // Or maybe only ADMIN should delete?
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { clientId } = context.params;

  try {
    const clientToDelete = await prisma.user.findFirst({
      where: { id: clientId, role: Role.CLIENT },
    });
    if (!clientToDelete) {
      return NextResponse.json(
        { message: "Client account not found or user is not a client." },
        { status: 404 }
      );
    }

    // CRITICAL: Check for active reservations or other important linked data before deleting
    const activeReservations = await prisma.reservation.count({
      where: {
        clientId: clientId,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
      },
    });
    if (activeReservations > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete client. They have ${activeReservations} active or upcoming reservation(s). Please cancel or complete these first.`,
        },
        { status: 409 }
      );
    }

    // Perform deletion in a transaction: delete ClientProfile, then User
    await prisma.$transaction(async (tx) => {
      await tx.clientProfile.deleteMany({ where: { userId: clientId } });
      // Also delete other related records: Feedbacks, Notifications, etc.
      await tx.feedback.deleteMany({ where: { userId: clientId } });
      await tx.notification.deleteMany({ where: { userId: clientId } });
      // Handle Reservations: either disallow delete if any exist, or anonymize/soft-delete them.
      // For now, we assume reservations are handled by the active check above or are past/cancelled.
      // This delete will fail if there are still reservations with this clientId due to FK constraints.
      await tx.user.delete({ where: { id: clientId } });
    });

    return NextResponse.json({
      message: "Client account deleted successfully.",
    });
  } catch (error: any) {
    console.error(`API_AGENT_CLIENT_ID_DELETE_ERROR (ID: ${clientId}):`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        // Foreign key constraint
        return NextResponse.json(
          {
            message:
              "Cannot delete client due to existing reservations or other linked records.",
            detail: "Please ensure all associated data is handled.",
          },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Client not found for deletion." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { message: "Error deleting client account", detail: error.message },
      { status: 500 }
    );
  }
}
