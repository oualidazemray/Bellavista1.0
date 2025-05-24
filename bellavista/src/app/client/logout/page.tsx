// src/app/client/logout/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Ensure lucide-react is installed

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Simulate logout process (replace with actual API calls and session clearing)
    console.log("Initiating logout...");
    // localStorage.removeItem('authToken'); // Example: clear token

    const timer = setTimeout(() => {
      router.push("/auth/login"); // Redirect to your login page
    }, 1500);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-white">
      {" "}
      {/* Adjusted min-height */}
      <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
      <h1 className="text-2xl font-semibold text-amber-300">
        Logging you out...
      </h1>
      <p className="text-slate-400">You will be redirected shortly.</p>
    </div>
  );
};

export default LogoutPage;
