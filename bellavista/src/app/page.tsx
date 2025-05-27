"use client";

import Navbar from "@/components/ui/navbar";
import LandingPage from "@/components/layout/landing/page";
import BookingOptionsPage from "@/components/ui/client/BookingOptionsPage/page";
import RoomsPage from "./client/reservations/page";
import DashboardPageContent from "./client/dashboard/page";
import Image from "next/image";
import { motion } from "framer-motion";
import ClientLayout from "./client/layout";
import DashboardPageForLayout from "./client/dashboard/page";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 
      <BookingOptionsPage /> 
      <RoomsPage />
      <ClientLayout>
        <DashboardPageForLayout />
      </ClientLayout>*/}
      <Navbar />
      <LandingPage />
    </div>
  );
}
