"use client";

import Navbar from "@/components/ui/navbar";
import LandingPage from "@/components/layout/landing/page";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <LandingPage />
    </div>
  );
}
