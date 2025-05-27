// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.error(`AUTH: No user found for email: ${credentials.email}`);
          throw new Error("No user found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          console.error(
            `AUTH: Incorrect password for email: ${credentials.email}`
          );
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt", // This strategy produces JWEs when a secret is provided
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // user object is available on initial sign in
        token.id = user.id;
        token.role = user.role; // user.role comes from authorize()
        // NextAuth v4+ automatically includes name, email, picture in token if available on user object from authorize.
        // For NextAuth v5 (Auth.js), you need to explicitly add them if not standard claims.
        // token.name = user.name;
        // token.email = user.email;
        // token.picture = user.image; // if you have an image
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // session.user.name = token.name as string; // Already on session.user by default
        // session.user.email = token.email as string; // Already on session.user by default
        // session.user.image = token.picture as string; // Already on session.user by default
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
