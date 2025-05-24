// src/app/client/history/feedback/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ModernSidebar from "../../NavbarClient";
import {
  Star,
  MessageSquarePlus as MessageSquareEdit,
  Send,
  Hotel,
  CalendarDays,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

// Mock reservation data structure
interface ReservationDetails {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  hotelImageUrl?: string;
}

// Mock function to fetch reservation details
const fetchReservationDetails = async (
  id: string
): Promise<ReservationDetails | null> => {
  console.log("Fetching details for reservation ID:", id);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const sampleReservations = [
    {
      id: "res123",
      hotelName: "The Grand Oasis Resort",
      roomType: "Deluxe Suite",
      checkInDate: new Date("2024-08-15"),
      checkOutDate: new Date("2024-08-18"),
      hotelImageUrl:
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "res456",
      hotelName: "City Central Boutique Hotel",
      roomType: "Standard Queen",
      checkInDate: new Date("2024-05-10"),
      checkOutDate: new Date("2024-05-12"),
      hotelImageUrl:
        "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "res112",
      hotelName: "Beachfront Paradise Villas",
      roomType: "Luxury Villa",
      checkInDate: new Date("2024-01-05"),
      checkOutDate: new Date("2024-01-10"),
      hotelImageUrl:
        "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  ];
  return sampleReservations.find((r) => r.id === id) || null;
};

const Feedback = () => {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId && typeof reservationId === "string") {
      setIsLoading(true);
      fetchReservationDetails(reservationId)
        .then((data) => {
          if (data) {
            setReservation(data);
          } else {
            setError("Reservation details not found.");
          }
        })
        .catch((err) => {
          console.error("Error fetching reservation:", err);
          setError("Failed to load reservation details.");
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("Reservation ID is missing.");
      setIsLoading(false);
    }
  }, [reservationId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    console.log("Submitting feedback:", { reservationId, rating, comment });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = true;
    if (success) {
      setSuccessMessage("Thank you! Your feedback has been submitted.");
    } else {
      setError("Failed to submit feedback. Please try again.");
    }
    setIsSubmitting(false);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
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
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div className="relative z-10 flex items-center">
          <Loader2 size={48} className="text-amber-400 animate-spin" />
          <p className="ml-3 text-xl text-amber-300">
            Loading Reservation Details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
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
        <div className="relative z-10 p-8 bg-black/50 backdrop-blur-sm rounded-lg border border-amber-600/30">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-semibold text-red-300 mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          {/* Update Link path to point to the correct history page */}
          <Link
            href="/client/history"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600 transition-colors duration-200 shadow-md hover:shadow-lg shadow-amber-500/30"
          >
            <ArrowLeft size={18} /> Go Back to History
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-amber-900/30 border border-amber-600/30 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-400/30">
              <MessageSquareEdit className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Leave Feedback
            </h1>
          </div>
          {/* Update Link path to point to the correct history page */}
          <Link
            href="/client/history"
            className="text-sm text-amber-300 hover:text-amber-100 hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Back to History
          </Link>
        </div>

        {reservation && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/70 flex items-center gap-4">
            {reservation.hotelImageUrl && (
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden relative">
                <img
                  src={reservation.hotelImageUrl}
                  alt={reservation.hotelName}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-amber-200">
                {reservation.hotelName}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                {reservation.roomType}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                Stay: {formatDate(reservation.checkInDate)} -{" "}
                {formatDate(reservation.checkOutDate)}
              </p>
            </div>
          </div>
        )}

        {successMessage ? (
          <div className="p-6 text-center bg-green-700/30 border border-green-500 rounded-lg">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <h2 className="text-xl font-semibold text-green-300 mb-2">
              Feedback Submitted!
            </h2>
            <p className="text-gray-300 mb-4">{successMessage}</p>
            {/* Update Link path to point to the correct history page */}
            <Link
              href="/client/history"
              className="inline-block px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600 transition-colors duration-200"
            >
              View Other Reservations
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-amber-300 mb-2">
                Your Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    className={`cursor-pointer transition-colors duration-150
                                            ${
                                              (hoverRating || rating) >= star
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-gray-600 hover:text-amber-300"
                                            }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-amber-300 mb-1"
              >
                Your Comments
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Tell us about your experience..."
                className="w-full px-3 py-2 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-200 text-white placeholder-gray-400 resize-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700/50"
                required
              />
            </div>

            {error && !successMessage && (
              <div className="p-3 bg-red-700/40 border border-red-500 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Feedback;
