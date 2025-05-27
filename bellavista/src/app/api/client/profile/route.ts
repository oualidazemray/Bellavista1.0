// src/app/api/client/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

interface UpdateProfileRequestBody {
  fullName?: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string; // Assumes this is a URL string
  taxId?: string;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true, // This is 'fullName'
        email: true,
        phone: true,
        profileImageUrl: true,
        bio: true,
        profile: {
          // ClientProfile relation
          select: {
            taxId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userProfileData = {
      fullName: user.name || "",
      email: user.email || "", // Email is not typically updatable by user directly
      phone: user.phone || "",
      profileImageUrl: user.profileImageUrl || null,
      bio: user.bio || "",
      taxId: user.profile?.taxId || "",
    };

    return NextResponse.json(userProfileData);
  } catch (error) {
    console.error("API_PROFILE_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id || token.role !== "CLIENT") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = token.id as string;

  try {
    const body = (await request.json()) as UpdateProfileRequestBody;

    const userDataToUpdate: {
      name?: string;
      phone?: string;
      profileImageUrl?: string;
      bio?: string;
    } = {};

    if (body.fullName !== undefined) userDataToUpdate.name = body.fullName;
    if (body.phone !== undefined) userDataToUpdate.phone = body.phone;
    if (body.profileImageUrl !== undefined)
      userDataToUpdate.profileImageUrl = body.profileImageUrl; // Assumes URL
    if (body.bio !== undefined) userDataToUpdate.bio = body.bio;

    const clientProfileDataToUpdate: { taxId?: string } = {};
    if (body.taxId !== undefined) clientProfileDataToUpdate.taxId = body.taxId;

    const [updatedUserResult, updatedClientProfileResult] =
      await prisma.$transaction(async (tx) => {
        let updatedUser;
        if (Object.keys(userDataToUpdate).length > 0) {
          updatedUser = await tx.user.update({
            where: { id: userId },
            data: userDataToUpdate,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImageUrl: true,
              bio: true,
            },
          });
        } else {
          updatedUser = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImageUrl: true,
              bio: true,
            },
          });
        }

        if (!updatedUser) throw new Error("User not found during transaction.");

        const updatedClientProfile = await tx.clientProfile.upsert({
          where: { userId: userId },
          update: clientProfileDataToUpdate,
          create: { userId: userId, ...clientProfileDataToUpdate },
          select: { taxId: true },
        });
        return [updatedUser, updatedClientProfile];
      });

    const responseProfile = {
      fullName: updatedUserResult.name || "",
      email: updatedUserResult.email, // Email is not changed by this endpoint
      phone: updatedUserResult.phone || "",
      profileImageUrl: updatedUserResult.profileImageUrl || null,
      bio: updatedUserResult.bio || "",
      taxId: updatedClientProfileResult?.taxId || "", // Use optional chaining for safety
    };

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: responseProfile,
    });
  } catch (error) {
    console.error("API_PROFILE_PUT_ERROR:", error);
    return NextResponse.json(
      { message: "Error updating profile", details: (error as Error).message },
      { status: 500 }
    );
  }
}
