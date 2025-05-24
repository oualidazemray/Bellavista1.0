// src/app/client/dashboard/page.tsx
"use client";

import React from "react";
import RoomsPage from "../reservations/page";
// This would be your "Facilities Booking" or main dashboard content
// For now, a placeholder matching the theme.
// You would import your actual FilterRoom or reservation components here.
// import FilterRoom from "@/components/ui/client/filterRoom"; // Example

const DashboardPageContent = () => {
  return (
    <div className="text-white">
      <RoomsPage />
    </div>
  );
};

const ClientDashboardPage = () => {
  return <DashboardPageContent />;
};

export default ClientDashboardPage;
