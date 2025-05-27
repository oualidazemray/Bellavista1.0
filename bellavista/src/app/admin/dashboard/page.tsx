// src/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BedDouble,
  FileText,
  BarChart2,
  AlertTriangle,
  BellRing,
  DollarSign,
  Activity,
  ArrowRight,
  CalendarCheck,
  LogIn,
  LogOut as LogOutIcon,
  UserPlus,
  Edit,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  ClockIcon,
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
import { Progress } from "@/components/ui/progress"; // For occupancy
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For recent activity
import { Badge } from "@/components/ui/badge"; // For status
import { useSession } from "next-auth/react"; // To get admin name
import { Loader2 } from "lucide-react"; // For loading state
import toast from "react-hot-toast";

// Interfaces for data fetched from API
interface DashboardSummary {
  pendingReservationsCount: number;
  upcomingCheckInsToday: number;
  upcomingCheckOutsToday: number;
  currentOccupancyRate?: number; // Percentage
  totalActiveReservations: number;
  recentActivities: ActivityItem[]; // Define ActivityItem below
}

interface ActivityItem {
  id: string;
  type:
    | "NEW_BOOKING"
    | "CANCELLATION"
    | "CHECK_IN"
    | "CHECK_OUT"
    | "NEW_FEEDBACK"
    | "USER_REGISTERED";
  description: string;
  timestamp: string; // ISO Date string
  link?: string; // Optional link to the relevant item
  userName?: string; // User associated with activity
}

// Mock API call - replace with actual backend call to /api/admin/dashboard-summary
const fetchAdminDashboardSummary = async (): Promise<DashboardSummary> => {
  console.log("Fetching admin dashboard summary...");
  // Simulate API call
  // In a real app, this would fetch data from one or more backend endpoints
  // that aggregate data from Prisma.
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    pendingReservationsCount: 3,
    upcomingCheckInsToday: 5,
    upcomingCheckOutsToday: 2,
    currentOccupancyRate: 75, // Example
    totalActiveReservations: 88,
    recentActivities: [
      {
        id: "act1",
        type: "NEW_BOOKING",
        description: "booked Room 101",
        userName: "Khalil A.",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        link: "/admin/reservations/res123",
      },
      {
        id: "act2",
        type: "CHECK_IN",
        description: "checked into Room 203",
        userName: "Aya G.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "act3",
        type: "NEW_FEEDBACK",
        description: "left feedback for stay in Room 305",
        userName: "John D.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        link: "/admin/feedbacks",
      },
      {
        id: "act4",
        type: "USER_REGISTERED",
        description: "New client registered.",
        userName: "Sara B.",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        link: "/admin/users",
      },
    ],
  };
};

const formatDateDistance = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const ActivityIcon: React.FC<{ type: ActivityItem["type"] }> = ({ type }) => {
  switch (type) {
    case "NEW_BOOKING":
      return <CalendarCheck className="w-4 h-4 text-green-500" />;
    case "CANCELLATION":
      return <XCircle className="w-4 h-4 text-red-500" />; // Assuming XCircle for cancel
    case "CHECK_IN":
      return <LogIn className="w-4 h-4 text-blue-500" />;
    case "CHECK_OUT":
      return <LogOutIcon className="w-4 h-4 text-orange-500" />;
    case "NEW_FEEDBACK":
      return <MessageSquare className="w-4 h-4 text-yellow-500" />;
    case "USER_REGISTERED":
      return <UserPlus className="w-4 h-4 text-purple-500" />;
    default:
      return <Activity className="w-4 h-4 text-slate-500" />;
  }
};

const AdminDashboardPage = () => {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminDashboardSummary(); // Replace with actual API call
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
      toast.error(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const adminName = session?.user?.name?.split(" ")[0] || "Admin"; // Get first name or default

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Dashboard...</p>
        <p className="text-sm text-slate-500">Preparing your overview.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl text-red-300">Error Loading Dashboard</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <Button
          onClick={loadDashboardData}
          variant="outline"
          className="border-purple-500 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center text-slate-400 py-10">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Logo */}
      <Card className="bg-slate-800/50 border-slate-700/70 shadow-xl">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Bellavista Logo"
              width={64}
              height={64}
              className="rounded-md"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {adminName}!
              </h1>
              <p className="text-slate-400">
                Here's what's happening at Bellavista today.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Link href="/admin/reservations">
              {" "}
              <FileText className="mr-2 h-4 w-4" /> View All Bookings
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Pending Reservations
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-400">
              {summary.pendingReservationsCount}
            </div>
            <p className="text-xs text-slate-500">
              Require immediate attention
            </p>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200"
            >
              <Link href="/admin/reservations">
                Validate Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Check-ins Today
            </CardTitle>
            <LogIn className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-400">
              {summary.upcomingCheckInsToday}
            </div>
            <p className="text-xs text-slate-500">Guests arriving today</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Check-outs Today
            </CardTitle>
            <LogOutIcon className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-400">
              {summary.upcomingCheckOutsToday}
            </div>
            <p className="text-xs text-slate-500">Guests departing today</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy & Active Reservations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-300">
              Current Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {summary.currentOccupancyRate?.toFixed(0) || "N/A"}%
            </div>
            <Progress
              value={summary.currentOccupancyRate || 0}
              className="w-full h-2 [&>div]:bg-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Based on available rooms today
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/70 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-teal-300">
              Total Active Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-400">
              {summary.totalActiveReservations}
            </div>
            <p className="text-xs text-slate-500">
              Currently PENDING or CONFIRMED
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="bg-slate-800/70 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-purple-300 flex items-center gap-2">
            <Activity size={22} /> Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-400">
            Latest important events in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {summary.recentActivities.slice(0, 5).map(
                (
                  activity // Show last 5
                ) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-slate-700/50 last:border-b-0 last:pb-0"
                  >
                    <Avatar className="h-8 w-8 border-2 border-slate-600">
                      {/* Use a generic icon or derive from activity.type */}
                      <AvatarFallback className="bg-slate-700 text-purple-300">
                        <ActivityIcon type={activity.type} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">
                        {activity.userName && (
                          <span className="font-semibold text-purple-300">
                            {activity.userName}
                          </span>
                        )}
                        {` `}
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <ClockIcon size={12} />{" "}
                        {formatDateDistance(activity.timestamp)}
                        {activity.link && (
                          <Link
                            href={activity.link}
                            className="ml-2 text-purple-400 hover:underline text-xs"
                          >
                            View
                          </Link>
                        )}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-slate-400 text-center py-4">
              No recent activity to display.
            </p>
          )}
        </CardContent>
        {summary.recentActivities.length > 5 && (
          <CardFooter>
            <Button
              variant="link"
              asChild
              className="text-purple-300 hover:text-purple-200 mx-auto"
            >
              <Link href="/admin/activity-log">View All Activity</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
