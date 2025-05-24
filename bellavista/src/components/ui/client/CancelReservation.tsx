// src/app/client/history/cancel/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2, // For page title
  CalendarDays,
  BedDouble,
  Hotel as HotelIcon, // Renamed to avoid conflict with Hotel type
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  XCircle, // For No button
} from "lucide-react";

interface CancellableReservationDetails {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  hotelImageUrl?: string;
  totalPrice?: number;
  cancellationPolicy?: string; // Example: "Free cancellation before 2024-08-01"
}

const fetchCancellableReservation = async (
  id: string
): Promise<CancellableReservationDetails | null> => {
  console.log("Fetching details for cancelling reservation ID:", id);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const sampleReservations = [
    {
      id: "res123",
      hotelName: "The Grand Oasis Resort",
      roomType: "Deluxe Ocean View Suite",
      checkInDate: new Date("2024-08-15"),
      checkOutDate: new Date("2024-08-18"),
      hotelImageUrl:
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
      totalPrice: 1250,
      cancellationPolicy: "Free cancellation up to 7 days before check-in.",
    },
    {
      id: "res789",
      hotelName: "Mountain View Lodge",
      roomType: "Cabin with Fireplace",
      checkInDate: new Date("2024-07-20"),
      checkOutDate: new Date("2024-07-25"),
      hotelImageUrl:
        "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=600",
      totalPrice: 980,
      cancellationPolicy: "Non-refundable after booking.",
    },
  ];
  return sampleReservations.find((r) => r.id === id) || null;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CancelReservation = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] =
    useState<CancellableReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (reservationId && typeof reservationId === "string") {
      setIsLoading(true);
      fetchCancellableReservation(reservationId)
        .then((data) => {
          if (data) {
            setReservation(data);
          } else {
            setError("Reservation details not found or cannot be cancelled.");
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

  const handleConfirmCancel = async () => {
    if (!reservation) return;
    setError(null);
    setIsCancelling(true);

    console.log("Cancelling reservation:", reservationId);
    // Simulate API call to cancel reservation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = true; // Math.random() > 0.1; // Higher chance of success for demo
    if (success) {
      setSuccessMessage(
        `Reservation for ${reservation.hotelName} has been successfully cancelled.`
      );
      // Optionally, redirect after a delay
      // setTimeout(() => router.push('/client/history'), 3000);
    } else {
      setError(
        "Failed to cancel reservation. Please contact support or try again."
      );
    }
    setIsCancelling(false);
    setConfirmCancel(false); // Reset confirmation step
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 size={48} className="text-amber-400 animate-spin" />
        <p className="ml-3 text-xl text-amber-300">Loading Reservation...</p>
      </div>
    );
  }

  if (error && !reservation && !successMessage) {
    // Show general error only if not already showing success
    return (
      <div className="p-8 bg-black/50 backdrop-blur-sm rounded-lg border border-amber-600/30 text-center">
        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-300 mb-2">Error</h2>
        <p className="text-gray-300 mb-6">{error}</p>
        <Link
          href="/client/history"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600"
        >
          <ArrowLeft size={18} /> Back to History
        </Link>
      </div>
    );
  }

  if (!reservation && !successMessage) {
    // Should be caught by error state
    return (
      <div className="text-center text-amber-300 p-8">
        Reservation not found or cannot be cancelled.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-amber-900/30 border border-amber-600/30 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
            <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Cancel Reservation
          </h1>
        </div>
        <Link
          href="/client/history"
          className="text-sm text-amber-300 hover:text-amber-100 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>

      {successMessage ? (
        <div className="p-6 text-center bg-green-700/30 border border-green-500 rounded-lg">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-green-300 mb-2">
            Cancellation Successful!
          </h2>
          <p className="text-gray-300 mb-4">{successMessage}</p>
          <Link
            href="/client/history"
            className="inline-block mt-2 px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600"
          >
            View Other Reservations
          </Link>
        </div>
      ) : (
        reservation && (
          <>
            <div className="mb-6 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
              {reservation.hotelImageUrl && (
                <div className="w-full h-48 rounded-md overflow-hidden relative mb-4">
                  <img
                    src={reservation.hotelImageUrl}
                    alt={reservation.hotelName}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold text-amber-200 mb-1">
                {reservation.hotelName}
              </h2>
              <p className="text-sm text-gray-300">
                <BedDouble
                  size={15}
                  className="inline mr-1 text-amber-400/80"
                />{" "}
                {reservation.roomType}
              </p>
              <p className="text-sm text-gray-300">
                <CalendarDays
                  size={15}
                  className="inline mr-1 text-amber-400/80"
                />{" "}
                Stay: {formatDate(reservation.checkInDate)} -{" "}
                {formatDate(reservation.checkOutDate)}
              </p>
              {reservation.totalPrice && (
                <p className="text-sm text-gray-300">
                  Total Price: ${reservation.totalPrice.toFixed(2)}
                </p>
              )}
              {reservation.cancellationPolicy && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <h3 className="text-xs font-semibold text-amber-300/80 uppercase mb-1">
                    Cancellation Policy
                  </h3>
                  <p className="text-xs text-gray-400">
                    {reservation.cancellationPolicy}
                  </p>
                </div>
              )}
            </div>

            {!confirmCancel ? (
              <div className="text-center">
                <p className="text-lg text-amber-100 mb-6">
                  Are you sure you want to cancel this reservation?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={isCancelling}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md disabled:opacity-70"
                  >
                    <Trash2 size={18} /> Yes, Cancel Reservation
                  </button>
                  <Link
                    href="/client/history"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold shadow-md"
                  >
                    <XCircle size={18} /> No, Keep Reservation
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
                <AlertTriangle
                  size={24}
                  className="mx-auto text-yellow-400 mb-2"
                />
                <p className="text-md text-yellow-200 mb-4">
                  This action cannot be undone. Please confirm your decision.
                </p>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold shadow-xl disabled:opacity-70"
                >
                  {isCancelling ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  {isCancelling ? "Processing..." : "CONFIRM CANCELLATION"}
                </button>
                {error && ( // Show cancellation specific error here
                  <p className="mt-4 text-sm text-red-300">{error}</p>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default CancelReservation;
