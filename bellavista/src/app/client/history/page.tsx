// src/components/ui/client/ReservationHistory.tsx (or src/app/client/history/page.tsx)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Hotel,
  BedDouble,
  Users,
  Edit,
  Trash2,
  MessageSquareText,
  ListChecks,
  Loader2,
  Star,
  MapPin,
  Clock,
  ChevronDown,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Eye,
  Award,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

// Keep all existing interfaces unchanged
export interface ReservationItem {
  id: string;
  hotelName: string;
  hotelImageUrl?: string | null;
  hotelImageAlt?: string | null;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: "upcoming" | "completed" | "cancelled";
  bookingDate: Date;
  feedbackGiven?: boolean;
  canCancel?: boolean;
  canEdit?: boolean;
}

interface ApiReservationItemRaw {
  id: string;
  hotelName: string;
  hotelImageUrl?: string | null;
  hotelImageAlt?: string | null;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: "upcoming" | "completed" | "cancelled";
  bookingDate: string;
  feedbackGiven?: boolean;
  canCancel?: boolean;
  canEdit?: boolean;
}

const mapApiItemToFrontend = (
  apiItem: ApiReservationItemRaw
): ReservationItem => ({
  ...apiItem,
  checkInDate: new Date(apiItem.checkInDate),
  checkOutDate: new Date(apiItem.checkOutDate),
  bookingDate: new Date(apiItem.bookingDate),
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusPill = (status: ReservationItem["status"]) => {
  const styles = {
    upcoming:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50",
    completed:
      "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50",
    cancelled:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50",
  };
  return styles[status] || styles.upcoming;
};

const getStatusIcon = (status: ReservationItem["status"]) => {
  switch (status) {
    case "upcoming":
      return <Calendar className="w-3 h-3" />;
    case "completed":
      return <Award className="w-3 h-3" />;
    case "cancelled":
      return <Clock className="w-3 h-3" />;
    default:
      return <Calendar className="w-3 h-3" />;
  }
};

const ReservationHistory: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price" | "hotel">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Keep original fetchReservations logic unchanged
  const fetchReservations = useCallback(async (tab: typeof activeTab) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/client/reservations?status=${tab}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch reservations");
      }
      const data: ApiReservationItemRaw[] = await response.json();
      setReservations(data.map(mapApiItemToFrontend));
    } catch (error: any) {
      console.error("Error fetching reservations:", error);
      toast.error(error.message || "Could not load reservations.");
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(activeTab);
  }, [activeTab, fetchReservations]);

  // Enhanced filtering and sorting
  const filteredAndSortedReservations = React.useMemo(() => {
    let filtered = reservations.filter(
      (res) =>
        res.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.roomType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.bookingDate.getTime() - a.bookingDate.getTime();
        case "price":
          return b.totalPrice - a.totalPrice;
        case "hotel":
          return a.hotelName.localeCompare(b.hotelName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [reservations, searchTerm, sortBy]);

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getTabCount = (status: typeof activeTab) => {
    if (status === "all") return reservations.length;
    return reservations.filter((r) => r.status === status).length;
  };

  const TabButton: React.FC<{ tab: typeof activeTab; label: string }> = ({
    tab,
    label,
  }) => {
    const count = getTabCount(tab);
    const isActive = activeTab === tab;

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 group
          ${
            isActive
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/50 scale-105"
              : "bg-gray-800/60 hover:bg-gray-700/80 text-amber-300/80 hover:text-amber-200 border border-gray-600/50 hover:border-amber-500/50"
          }`}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(tab as ReservationItem["status"])}
          <span>{label}</span>
          {count > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold
              ${
                isActive
                  ? "bg-black/20 text-black"
                  : "bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30"
              }`}
            >
              {count}
            </span>
          )}
        </div>
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
        )}
      </button>
    );
  };

  // Stats calculation
  const stats = React.useMemo(() => {
    const totalSpent = reservations.reduce(
      (sum, res) => sum + res.totalPrice,
      0
    );
    const completedStays = reservations.filter(
      (r) => r.status === "completed"
    ).length;
    const upcomingStays = reservations.filter(
      (r) => r.status === "upcoming"
    ).length;

    return { totalSpent, completedStays, upcomingStays };
  }, [reservations]);

  if (isLoading && reservations.length === 0) {
    return (
      <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 z-0">
          <Image
            src="/beachBack.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-gray-900/90" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <Loader2 size={64} className="text-amber-400 animate-spin" />
            <div className="absolute inset-0 animate-ping">
              <Loader2 size={64} className="text-amber-400/30" />
            </div>
          </div>
          <p className="mt-6 text-xl text-amber-300 animate-pulse">
            Loading Your Journey...
          </p>
          <div className="mt-4 flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/beachBack.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-gray-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-blue-900/20" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6">
        {/* Enhanced Header with Stats */}
        <div className="mb-8">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-6 shadow-2xl shadow-amber-500/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-400/50">
                    <ListChecks className="w-8 h-8 text-black" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 bg-clip-text text-transparent">
                    My Reservations
                  </h1>
                  <p className="text-amber-300/80 mt-1">
                    Your travel journey awaits
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                  <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-blue-300">
                    {stats.completedStays}
                  </div>
                  <div className="text-xs text-blue-400/80">Completed</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <Calendar className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-green-300">
                    {stats.upcomingStays}
                  </div>
                  <div className="text-xs text-green-400/80">Upcoming</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                  <DollarSign className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-amber-300">
                    ${stats.totalSpent.toFixed(0)}
                  </div>
                  <div className="text-xs text-amber-400/80">Total Spent</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="mb-6 bg-black/40 backdrop-blur-xl rounded-xl border border-gray-600/30 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search hotels or room types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="hotel">Sort by Hotel</option>
              </select>

              {isLoading && (
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center sm:justify-start">
          <TabButton tab="all" label="All Reservations" />
          <TabButton tab="upcoming" label="Upcoming" />
          <TabButton tab="completed" label="Completed" />
          <TabButton tab="cancelled" label="Cancelled" />
        </div>

        {/* Content */}
        {!isLoading && filteredAndSortedReservations.length === 0 ? (
          <div className="text-center py-16 px-6 bg-black/40 backdrop-blur-xl rounded-2xl border border-amber-600/20">
            <div className="relative inline-block mb-6">
              <CalendarDays size={80} className="text-amber-400/50" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-amber-300 mb-3">
              {searchTerm
                ? "No matching reservations"
                : "No Reservations Found"}
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              {searchTerm
                ? `No reservations match "${searchTerm}"`
                : `You currently have no ${
                    activeTab !== "all" ? `${activeTab} ` : ""
                  }reservations.`}
            </p>
            {activeTab === "all" && !searchTerm && (
              <Link
                href="/client/reservations"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300"
              >
                <Hotel className="w-5 h-5" />
                Start Your Journey
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAndSortedReservations.map((res, index) => {
              const isExpanded = expandedCards.has(res.id);
              const daysUntilCheckIn = Math.ceil(
                (res.checkInDate.getTime() - new Date().getTime()) /
                  (1000 * 3600 * 24)
              );

              return (
                <div
                  key={res.id}
                  className="group bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-600/30 overflow-hidden hover:border-amber-500/50 transition-all duration-500 hover:shadow-amber-500/20 hover:scale-[1.02] transform"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: "fadeInUp 0.6s ease-out forwards",
                  }}
                >
                  <div className="lg:flex">
                    {/* Enhanced Image Section */}
                    <div className="lg:w-2/5 relative h-64 lg:h-auto">
                      <img
                        src={
                          res.hotelImageUrl || "/hotel-placeholder-generic.jpg"
                        }
                        alt={res.hotelImageAlt || `Image of ${res.hotelName}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/hotel-placeholder-generic.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Status Badge */}
                      <div
                        className={`absolute top-4 right-4 px-3 py-1.5 text-sm font-bold rounded-full flex items-center gap-2 ${getStatusPill(
                          res.status
                        )}`}
                      >
                        {getStatusIcon(res.status)}
                        {res.status.charAt(0).toUpperCase() +
                          res.status.slice(1)}
                      </div>

                      {/* Countdown for upcoming reservations */}
                      {res.status === "upcoming" && daysUntilCheckIn > 0 && (
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                          {daysUntilCheckIn} days to go!
                        </div>
                      )}
                    </div>

                    {/* Enhanced Content Section */}
                    <div className="lg:w-3/5 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-amber-300 mb-2 group-hover:text-amber-200 transition-colors duration-300">
                            {res.hotelName}
                          </h2>
                          <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                            <div className="flex items-center gap-2">
                              <BedDouble size={16} className="text-amber-400" />
                              <span>{res.roomType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-amber-400" />
                              <span>
                                {res.numberOfGuests} Guest
                                {res.numberOfGuests > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleCardExpansion(res.id)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Basic Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 font-medium">
                              Check-in
                            </span>
                          </div>
                          <div className="text-white font-semibold">
                            {formatDate(res.checkInDate)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span className="text-red-300 font-medium">
                              Check-out
                            </span>
                          </div>
                          <div className="text-white font-semibold">
                            {formatDate(res.checkOutDate)}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          isExpanded
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pt-4 border-t border-gray-600/50 mb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-amber-200/80 font-medium">
                                Booked:
                              </span>
                              <div className="text-white">
                                {formatDate(res.bookingDate)}
                              </div>
                            </div>
                            <div>
                              <span className="text-amber-200/80 font-medium">
                                Total Cost:
                              </span>
                              <div className="text-2xl font-bold text-green-400">
                                ${res.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-600/30">
                        {res.status === "completed" && (
                          <Link
                            href={{
                              pathname: "/client/history/feedback",
                              query: { reservationId: res.id },
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                              res.feedbackGiven
                                ? "bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30"
                                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-500/60 shadow-lg shadow-amber-500/20"
                            }`}
                          >
                            <MessageSquareText size={16} />
                            {res.feedbackGiven
                              ? "Feedback Submitted"
                              : "Leave Feedback"}
                          </Link>
                        )}

                        {res.status === "upcoming" && res.canEdit && (
                          <Link
                            href={{
                              pathname: "/client/history/edit",
                              query: { reservationId: res.id },
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 border border-blue-500/40 hover:border-blue-500/60 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20"
                          >
                            <Edit size={16} />
                            View/Edit Details
                          </Link>
                        )}

                        {res.status === "upcoming" && res.canCancel && (
                          <Link
                            href={{
                              pathname: "/client/history/cancel",
                              query: { reservationId: res.id },
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-300 border border-red-500/40 hover:border-red-500/60 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/20"
                          >
                            <Trash2 size={16} />
                            Cancel Reservation
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ReservationHistory;
