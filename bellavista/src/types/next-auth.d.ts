import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt"; // Good practice to alias to avoid naming conflicts

// Define your role enum if you want stricter typing than just 'string'
// This should match your Prisma enum if possible, or be a subset you expect in the session.
type UserRole = "CLIENT" | "AGENT" | "ADMIN"; // Or import your Prisma Role enum if accessible here

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: string | null; // You are adding this
      role?: UserRole | null; // Use your UserRole type for better safety
    } & DefaultSession["user"]; // Extends default user (name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the object returned by the `CredentialsProvider`'s `authorize` function.
   * This is then passed to the `jwt` callback's `user` parameter.
   */
  interface User extends DefaultUser {
    // DefaultUser already has id, name, email, image
    role?: UserRole | null; // Add your custom role here
    // Add any other custom properties your `authorize` function returns for the `user` object
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    // DefaultJWT has name, email, picture, sub, iat, exp, jti
    id?: string | null; // You are adding this in your jwt callback
    role?: UserRole | null; // You are adding this in your jwt callback
    // Add any other custom properties you add to the token in the `jwt` callback
  }
}
