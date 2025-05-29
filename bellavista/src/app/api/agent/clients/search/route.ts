// src/app/api/agent/clients/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

export interface SearchedClient {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.AGENT) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const emailQuery = searchParams.get("email");
  if (!emailQuery || emailQuery.trim() === "") {
    return NextResponse.json(
      { message: "Email query parameter is required." },
      { status: 400 }
    );
  }
  const trimmedEmailQuery = emailQuery.trim();
  try {
    const clientsFromDb = await prisma.user.findMany({
      where: {
        role: Role.CLIENT,
        email: { contains: trimmedEmailQuery, mode: "insensitive" },
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 10,
    });
    const mappedClients: SearchedClient[] = clientsFromDb.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
    }));
    return NextResponse.json({ clients: mappedClients }); // Return { clients: [...] }
  } catch (error: any) {
    console.error("API_AGENT_CLIENT_SEARCH_ERROR:", error);
    return NextResponse.json(
      { message: "Error searching for clients", detail: error.message },
      { status: 500 }
    );
  }
}
