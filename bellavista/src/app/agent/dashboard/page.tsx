// src/app/agent/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  BedDouble,
  CalendarPlus,
  ClipboardEdit,
  TrendingUp,
  LogIn,
  LogOut as LogOutIcon,
  AlertTriangle,
  Loader2,
  Briefcase,
  CreditCard,
  ArrowRight,
  Clock, // Added relevant icons
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

// Interface for dashboard summary data (same as before)
interface AgentDashboardSummary {
  upcomingCheckInsToday: number;
  upcomingCheckOutsToday: number;
  systemPendingReservations: number;
  bookingsByThisAgentToday: number;
  // Potentially add:
  // totalActiveGuests: number;
  // averageStayLength: number;
}

// Mock API call - replace with actual fetch
const fetchAgentDashboardSummaryFromAPI =
  async (): Promise<AgentDashboardSummary> => {
    console.log("AGENT_DASHBOARD: Fetching /api/agent/dashboard-summary");
    const response = await fetch("/api/agent/dashboard-summary");
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to load dashboard data (non-JSON response)",
      }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    const data = await response.json();
    console.log("AGENT_DASHBOARD: Data received from API:", data);
    return data;
  };

const StatDisplayCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  accentColorClass?: string;
}> = ({
  title,
  value,
  icon,
  description,
  accentColorClass = "text-cyan-400",
}) => (
  <Card className="bg-slate-800/60 border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-300">
        {title}
      </CardTitle>
      <div className={accentColorClass}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className={`text-4xl font-bold text-white`}>{value}</div>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

const QuickActionLink: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  accentColorClass?: string;
}> = ({
  title,
  description,
  icon,
  link,
  accentColorClass = "text-cyan-400",
}) => (
  <Link href={link} className="block group">
    <Card className="bg-slate-800/60 border-slate-700/50 shadow-lg hover:bg-slate-700/80 hover:border-slate-600/70 transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div
          className={`p-3 rounded-lg bg-slate-700/50 inline-block mb-3 border border-slate-600 group-hover:border-${accentColorClass}/50`}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: `w-6 h-6 ${accentColorClass} group-hover:scale-110 transition-transform`,
          })}
        </div>
        <CardTitle className="text-md font-semibold text-slate-100 group-hover:text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-grow">
        <CardDescription className="text-xs text-slate-400 group-hover:text-slate-300">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter className="pt-3 mt-auto">
        <Button
          variant="link"
          className={`p-0 h-auto text-xs ${accentColorClass} group-hover:underline`}
        >
          Go to section <ArrowRight className="ml-1 w-3 h-3" />
        </Button>
      </CardFooter>
    </Card>
  </Link>
);

const AgentDashboardPage = () => {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<AgentDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const loadAgentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAgentDashboardSummaryFromAPI();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
      toast.error(err.message || "Failed to load dashboard data.");
      setSummary(null); // Ensure summary is null on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  const agentFirstName = session?.user?.name?.split(" ")[0] || "Agent";

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Agent Dashboard...</p>
        <p className="text-sm text-slate-500">Preparing your workspace.</p>
      </div>
    );
  }

  if (error || !summary) {
    // Show error or if summary is still null after loading
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl text-red-300">Error Loading Dashboard Data</p>
        <p className="text-sm text-slate-400 mb-4">
          {error || "Could not retrieve dashboard summary."}
        </p>
        <Button
          onClick={loadAgentData}
          variant="outline"
          className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800/70 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {greeting}, <span className="text-cyan-400">{agentFirstName}!</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Here's your overview for today. Let's make it a great day for our
            guests!
          </p>
        </div>
        <Avatar className="w-16 h-16 mt-4 sm:mt-0 border-2 border-cyan-500 shadow-lg">
          <AvatarImage
            src={session?.user?.image || undefined}
            alt={agentFirstName}
          />
          <AvatarFallback className="bg-cyan-700 text-cyan-200 text-xl">
            {agentFirstName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatDisplayCard
          title="Check-ins Today"
          value={summary.upcomingCheckInsToday}
          icon={<LogIn size={20} />}
          description="Expected arrivals"
          accentColorClass="text-green-400"
        />
        <StatDisplayCard
          title="Check-outs Today"
          value={summary.upcomingCheckOutsToday}
          icon={<LogOutIcon size={20} />}
          description="Expected departures"
          accentColorClass="text-orange-400"
        />
        <StatDisplayCard
          title="System Pending"
          value={summary.systemPendingReservations}
          icon={<Clock size={20} />}
          description="Reservations needing review"
          accentColorClass="text-yellow-400"
        />
        <StatDisplayCard
          title="My Bookings Today"
          value={summary.bookingsByThisAgentToday}
          icon={<CalendarPlus size={20} />}
          description="Created by you"
          accentColorClass="text-blue-400"
        />
      </div>

      <Separator className="my-8 bg-slate-700/50" />

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-2xl font-semibold text-cyan-300 mb-5 flex items-center gap-2">
          <Briefcase size={24} /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <QuickActionLink
            title="New Guest Booking"
            description="Create a reservation for a walk-in or phone client."
            icon={<CalendarPlus />}
            link="/agent/new-booking"
            color="cyan"
          />
          <QuickActionLink
            title="Manage Reservations"
            description="View, modify, check-in/out existing bookings."
            icon={<ClipboardEdit />}
            link="/agent/reservations"
            color="blue"
          />
          <QuickActionLink
            title="Room Availability"
            description="Check current and future room availability calendar."
            icon={<BedDouble />}
            link="/agent/availability"
            color="green"
          />
          <QuickActionLink
            title="Client Accounts"
            description="Search, create, or manage client profiles."
            icon={<Users />}
            link="/agent/clients"
            color="purple"
          />
          <QuickActionLink
            title="Billing & Invoices"
            description="Generate and manage invoices for stays and services."
            icon={<CreditCard />}
            link="/agent/billing"
            color="amber"
          />
          <QuickActionLink
            title="Today's Overview"
            description="Detailed list of today's arrivals & departures."
            icon={<TrendingUp />}
            link="/agent/today-overview"
            color="teal"
          />{" "}
          {/* Example for a new page */}
        </div>
      </div>

      {/* Placeholder for additional sections like "Recent Activity by Agent" or "Assigned Tasks" */}
      <Card className="bg-slate-800/60 border-slate-700/50 text-white mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-cyan-300">
            Agent Activity Log
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Recent actions performed by you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8 text-sm">
            (Feature coming soon: A list of your recent bookings, check-ins,
            etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboardPage;
