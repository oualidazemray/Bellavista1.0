// src/components/ui/client/ReservationHistory.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Hotel,
  BedDouble,
  Users,
  Star,
  Edit,
  Trash2,
  MessageSquareText,
  ListChecks,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

export interface ReservationItem {
  id: string;
  hotelName: string;
  hotelImageUrl?: string; // This will now hold URLs like Pexels
  hotelImageAlt?: string; // Alt text for the image
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

const initialReservationsData: ReservationItem[] = [
  {
    id: "res123",
    hotelName: "The Grand Oasis Resort",
    hotelImageUrl:
      "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600", // Pexels URL
    hotelImageAlt: "Luxury resort pool view",
    roomType: "Deluxe Ocean View Suite",
    checkInDate: new Date("2024-08-15"),
    checkOutDate: new Date("2024-08-18"),
    numberOfGuests: 2,
    totalPrice: 1250,
    status: "upcoming",
    bookingDate: new Date("2024-06-01"),
    canCancel: true,
    canEdit: true,
  },
  {
    id: "res456",
    hotelName: "City Central Boutique Hotel",
    hotelImageUrl:
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600", // Pexels URL
    hotelImageAlt: "Modern hotel room interior",
    roomType: "Standard Queen Room",
    checkInDate: new Date("2024-05-10"),
    checkOutDate: new Date("2024-05-12"),
    numberOfGuests: 1,
    totalPrice: 320,
    status: "completed",
    bookingDate: new Date("2024-04-20"),
    feedbackGiven: true,
  },
  {
    id: "res789",
    hotelName: "Mountain View Lodge",
    hotelImageUrl:
      "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=600", // Your example Pexels URL
    hotelImageAlt: "Cozy mountain lodge room",
    roomType: "Cabin with Fireplace",
    checkInDate: new Date("2024-07-20"),
    checkOutDate: new Date("2024-07-25"),
    numberOfGuests: 4,
    totalPrice: 980,
    status: "upcoming",
    bookingDate: new Date("2024-05-15"),
    canCancel: true,
    canEdit: false,
  },
  {
    id: "res101",
    hotelName: "Historic Downtown Inn",
    // No image for this one to test fallback, hotelImageAlt will be generic
    roomType: "Classic Double Room",
    checkInDate: new Date("2024-03-01"),
    checkOutDate: new Date("2024-03-03"),
    numberOfGuests: 2,
    totalPrice: 450,
    status: "cancelled",
    bookingDate: new Date("2024-02-10"),
  },
  {
    id: "res112",
    hotelName: "Beachfront Paradise Villas",
    hotelImageUrl:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600", // Pexels URL
    hotelImageAlt: "Beachfront villa with pool",
    roomType: "Luxury Beach Villa",
    checkInDate: new Date("2024-01-05"),
    checkOutDate: new Date("2024-01-10"),
    numberOfGuests: 2,
    totalPrice: 2500,
    status: "completed",
    bookingDate: new Date("2023-11-15"),
    feedbackGiven: false,
  },
];

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ReservationHistory: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all");

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setReservations(
        initialReservationsData.sort(
          (a, b) => b.bookingDate.getTime() - a.bookingDate.getTime()
        )
      );
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredReservations = reservations.filter((res) => {
    if (activeTab === "all") return true;
    return res.status === activeTab;
  });

  const getStatusPill = (status: ReservationItem["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/80 text-blue-100";
      case "completed":
        return "bg-green-500/80 text-green-100";
      case "cancelled":
        return "bg-red-500/80 text-red-100";
      default:
        return "bg-gray-500/80 text-gray-100";
    }
  };

  const TabButton: React.FC<{ tab: typeof activeTab; label: string }> = ({
    tab,
    label,
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${
                      activeTab === tab
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                        : "bg-gray-700/50 hover:bg-gray-600/70 text-amber-300/80 hover:text-amber-200"
                    }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6">
      <div className="absolute inset-0 z-0">
        <Image
          src="/beachBack.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-600/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-400/30">
              <ListChecks className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              My Reservations
            </h1>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
          <TabButton tab="all" label="All" />
          <TabButton tab="upcoming" label="Upcoming" />
          <TabButton tab="completed" label="Completed" />
          <TabButton tab="cancelled" label="Cancelled" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={48} className="text-amber-400 animate-spin" />
            <p className="ml-3 text-lg text-amber-300">
              Loading reservations...
            </p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-10 px-6 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-600/20">
            <CalendarDays
              size={64}
              className="mx-auto text-amber-400/50 mb-4"
            />
            <h2 className="text-xl font-semibold text-amber-300 mb-2">
              No Reservations Found
            </h2>
            <p className="text-gray-400">
              You currently have no {activeTab !== "all" ? activeTab : ""}{" "}
              reservations.
              {activeTab === "all" && " Why not book your next getaway?"}
            </p>
            {activeTab === "all" && (
              <Link
                href="/find-rooms"
                className="mt-6 inline-block px-6 py-2.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600 transition-colors duration-200 shadow-md hover:shadow-lg shadow-amber-500/30"
              >
                Find a Room
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((res) => (
              <div
                key={res.id}
                className="bg-black/50 backdrop-blur-sm rounded-lg shadow-lg border border-amber-600/30 overflow-hidden transition-all duration-300 hover:shadow-amber-500/20 hover:border-amber-500/50 group"
              >
                {" "}
                {/* Added group for potential group-hover effects */}
                <div className="md:flex">
                  <div className="md:w-1/3 relative h-48 md:h-auto">
                    <img
                      src={
                        res.hotelImageUrl || "/hotel-placeholder-generic.jpg"
                      } // Fallback local image
                      alt={res.hotelImageAlt || `Image of ${res.hotelName}`} // Use specific alt or generate one
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Optional: handle broken external image links more gracefully
                        // e.currentTarget.src = '/hotel-placeholder-generic.jpg'; // Or hide the image
                        // e.currentTarget.alt = 'Image not available';
                      }}
                    />
                    <div
                      className={`absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full shadow-md ${getStatusPill(
                        res.status
                      )}`}
                    >
                      {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                    </div>
                  </div>

                  <div className="md:w-2/3 p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl sm:text-2xl font-semibold text-amber-300 hover:text-amber-200 transition-colors">
                        {res.hotelName}
                      </h2>
                    </div>

                    <p className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                      <BedDouble size={16} className="text-amber-400/80" />{" "}
                      {res.roomType}
                    </p>
                    <p className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                      <Users size={16} className="text-amber-400/80" />{" "}
                      {res.numberOfGuests} Guest
                      {res.numberOfGuests > 1 ? "s" : ""}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                      <div className="text-gray-400">
                        <span className="font-medium text-amber-200/80">
                          Check-in:
                        </span>{" "}
                        {formatDate(res.checkInDate)}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium text-amber-200/80">
                          Check-out:
                        </span>{" "}
                        {formatDate(res.checkOutDate)}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium text-amber-200/80">
                          Booked:
                        </span>{" "}
                        {formatDate(res.bookingDate)}
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium text-amber-200/80">
                          Total:
                        </span>{" "}
                        ${res.totalPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 border-t border-amber-500/20">
                      {res.status === "completed" && (
                        <Link
                          href={{
                            pathname: "/client/history/feedback", // Adjusted path
                            query: { reservationId: res.id },
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md font-medium transition-all duration-200
                                          ${
                                            res.feedbackGiven
                                              ? "bg-gray-600/70 text-gray-400 cursor-not-allowed border border-gray-500/50"
                                              : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-500/60"
                                          }`}
                        >
                          <MessageSquareText size={16} />{" "}
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
                          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 hover:border-blue-500/60 font-medium transition-all duration-200"
                        >
                          <Edit size={16} /> View/Edit Details
                        </Link>
                      )}
                      {res.status === "upcoming" && res.canCancel && (
                        <Link
                          href={{
                            pathname: "/client/history/cancel",
                            query: { reservationId: res.id },
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 hover:border-red-500/60 font-medium transition-all duration-200"
                        >
                          <Trash2 size={16} /> Cancel Reservation
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationHistory;
