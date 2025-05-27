"use client"; // This component needs to be a Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  // You can also pass the session object from a Server Component if needed,
  // though for client-side useSession, this is usually not required at this top level.
  // session?: any;
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  children /*, session*/,
}) => {
  // If you were passing an initial session from a Server Component:
  // return <SessionProvider session={session}>{children}</SessionProvider>;
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthProvider;
