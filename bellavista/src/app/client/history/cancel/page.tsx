// src/app/client/history/cancel/page.tsx (or your CancelReservation.tsx component)
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image"; // Using Next/Image
import Link from "next/link";
import {
  Trash2,
  CalendarDays,
  BedDouble,
  Hotel as HotelIcon,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast"; // For notifications

// This interface should match the response from GET /api/client/reservations/[id]
interface CancellableReservationDetails {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  hotelImageUrl?: string | null;
  totalPrice?: number;
  cancellationPolicyDetails?: string;
  canCancel?: boolean; // This flag from API is crucial
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString + "T00:00:00Z"); // Treat as UTC
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const CancelReservationPage = () => {
  // Renamed for clarity
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] =
    useState<CancellableReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmStep, setShowConfirmStep] = useState(false); // For the two-step confirmation

  useEffect(() => {
    if (reservationId) {
      setIsLoading(true);
      setError(null);

      const fetchDetailsForCancel = async () => {
        try {
          console.log(
            `CANCEL_PAGE: Fetching /api/client/reservations/${reservationId}`
          );
          const response = await fetch(
            `/api/client/reservations/${reservationId}`
          ); // GET request
          const responseText = await response.text();
          console.log(
            `CANCEL_PAGE: Fetch response status: ${
              response.status
            }, text: ${responseText.substring(0, 200)}`
          );

          if (!response.ok) {
            let errorMsg = `Failed to load reservation details (Status: ${response.status}).`;
            try {
              if (
                responseText &&
                response.headers
                  .get("content-type")
                  ?.includes("application/json")
              ) {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.message || errorMsg;
              } else if (responseText) {
                errorMsg = responseText.substring(0, 100);
              }
            } catch (e) {
              console.error(
                "CANCEL_PAGE: Failed to parse error response text",
                e
              );
            }
            throw new Error(errorMsg);
          }

          const data: CancellableReservationDetails = JSON.parse(responseText);

          if (data && data.canCancel === true) {
            // Check canCancel flag from API
            setReservation(data);
          } else if (data && data.canCancel === false) {
            setError(
              data.cancellationPolicyDetails ||
                "This reservation cannot be cancelled at this time according to policy."
            );
            setReservation(data); // Still set data to display info, but actions will be disabled
          } else {
            setError(
              "Reservation details not found or cannot be processed for cancellation."
            );
            setReservation(null);
          }
        } catch (err: any) {
          console.error(
            "CANCEL_PAGE: Error fetching reservation for cancellation:",
            err
          );
          setError(err.message || "Failed to load reservation details.");
          setReservation(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetailsForCancel();
    } else {
      setError("Reservation ID is missing in URL.");
      setIsLoading(false);
    }
  }, [reservationId]);

  const handlePerformCancellation = async () => {
    if (!reservation || !reservation.canCancel) {
      toast.error("This reservation cannot be cancelled.");
      return;
    }
    setError(null);
    setIsCancelling(true);

    try {
      console.log(
        `CANCEL_PAGE: Sending POST to /api/client/reservations/${reservationId}/cancel`
      );
      // POST to the new dedicated cancel endpoint
      const response = await fetch(
        `/api/client/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // No body needed if the action is implicit by the URL, or send empty {}
          // body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel reservation.");
      }
      setSuccessMessage(
        result.message ||
          `Reservation for ${reservation.hotelName} has been successfully cancelled.`
      );
      toast.success("Reservation cancelled!");
      // router.push('/client/history'); // Optional: redirect after success
    } catch (err: any) {
      console.error("CANCEL_PAGE: Error during cancellation API call:", err);
      setError(err.message || "An unexpected error occurred while cancelling.");
      toast.error(err.message || "Cancellation failed.");
    } finally {
      setIsCancelling(false);
      setShowConfirmStep(false); // Reset confirmation step
    }
  };

  if (isLoading) {
    /* ... your loading UI ... */
  }

  if (error && !reservation && !successMessage) {
    /* ... your general error UI from image ... */
  }

  if (!reservation && !successMessage && !isLoading) {
    return (
      <div className="text-center text-amber-300 p-8">
        Reservation details could not be loaded.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-red-900/30 border border-red-600/30 p-6 sm:p-8 mt-4">
      {" "}
      {/* Added mt-4 */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
            <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Cancel Reservation
          </h1>
        </div>
        {!successMessage && ( // Hide back button if success message is shown
          <Link
            href="/client/history"
            className="text-sm text-amber-300 hover:text-amber-100 hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Back to History
          </Link>
        )}
      </div>
      {
        successMessage ? (
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
        ) : reservation ? (
          <>
            <div className="mb-6 p-4 bg-slate-800/60 rounded-lg border border-slate-700">
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
              <p className="text-sm text-slate-300">
                <BedDouble
                  size={15}
                  className="inline mr-1 text-amber-400/80"
                />{" "}
                {reservation.roomType}
              </p>
              <p className="text-sm text-slate-300">
                <CalendarDays
                  size={15}
                  className="inline mr-1 text-amber-400/80"
                />{" "}
                Stay: {formatDate(reservation.checkInDate)} -{" "}
                {formatDate(reservation.checkOutDate)}
              </p>
              {reservation.totalPrice !== undefined && (
                <p className="text-sm text-slate-300">
                  Total Price: ${reservation.totalPrice.toFixed(2)}
                </p>
              )}
              {reservation.cancellationPolicyDetails && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <h3 className="text-xs font-semibold text-amber-300/80 uppercase mb-1">
                    Cancellation Policy
                  </h3>
                  <p className="text-xs text-slate-400">
                    {reservation.cancellationPolicyDetails}
                  </p>
                </div>
              )}
              {!reservation.canCancel && ( // If API says it cannot be cancelled
                <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
                  <AlertTriangle className="inline w-4 h-4 mr-2" />
                  This reservation is no longer eligible for cancellation
                  through this portal based on the current policy. Please
                  contact support if you have questions.
                </div>
              )}
            </div>

            {reservation.canCancel &&
              !showConfirmStep && ( // Show initial confirmation only if cancellable
                <div className="text-center">
                  <p className="text-lg text-amber-100 mb-6">
                    Are you sure you want to cancel this reservation?
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => setShowConfirmStep(true)}
                      disabled={isCancelling}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md disabled:opacity-70"
                    >
                      <Trash2 size={18} /> Yes, Proceed to Cancel
                    </button>
                    <Link
                      href="/client/history"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold shadow-md"
                    >
                      <XCircle size={18} /> No, Keep Reservation
                    </Link>
                  </div>
                </div>
              )}

            {reservation.canCancel && showConfirmStep && (
              <div className="text-center p-4 bg-red-800/30 border border-red-600 rounded-lg">
                <AlertTriangle
                  size={24}
                  className="mx-auto text-red-300 mb-2"
                />
                <p className="text-md text-red-200 mb-4">
                  This action cannot be undone. Please confirm your decision.
                </p>
                <button
                  onClick={handlePerformCancellation}
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
                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}{" "}
                {/* Show specific cancellation error here */}
              </div>
            )}
          </>
        ) : null // End of reservation && !successMessage block
      }
    </div>
  );
};

export default CancelReservationPage;
