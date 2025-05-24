// src/app/client/history/edit/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Edit3, // For page title
  CalendarDays,
  Users,
  BedDouble,
  Save,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

// Mock reservation data structure - in a real app, you'd fetch this
interface EditableReservationDetails {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: string; // Store as string for input[type="date"] compatibility
  checkOutDate: string; // Store as string
  numberOfGuests: number;
  hotelImageUrl?: string;
  originalPrice?: number; // To show if price changes
}

// Mock function to fetch reservation details
const fetchEditableReservation = async (
  id: string
): Promise<EditableReservationDetails | null> => {
  console.log("Fetching details for editing reservation ID:", id);
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In a real app, replace this with an actual API call
  const sampleReservations = [
    {
      id: "res123",
      hotelName: "The Grand Oasis Resort",
      roomType: "Deluxe Ocean View Suite",
      checkInDate: "2024-08-15",
      checkOutDate: "2024-08-18",
      numberOfGuests: 2,
      hotelImageUrl:
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
      originalPrice: 1250,
    },
    {
      id: "res789",
      hotelName: "Mountain View Lodge",
      roomType: "Cabin with Fireplace",
      checkInDate: "2024-07-20",
      checkOutDate: "2024-07-25",
      numberOfGuests: 4,
      hotelImageUrl:
        "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=600",
      originalPrice: 980,
    },
  ];
  return sampleReservations.find((r) => r.id === id) || null;
};

// Helper to format date string 'YYYY-MM-DD' to a readable format
const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, {
    // Add T00:00:00 to avoid timezone issues with date-only strings
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const EditReservation = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] =
    useState<EditableReservationDetails | null>(null);
  const [formData, setFormData] = useState<Partial<EditableReservationDetails>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId && typeof reservationId === "string") {
      setIsLoading(true);
      fetchEditableReservation(reservationId)
        .then((data) => {
          if (data) {
            setReservation(data);
            setFormData({
              checkInDate: data.checkInDate,
              checkOutDate: data.checkOutDate,
              numberOfGuests: data.numberOfGuests,
            });
          } else {
            setError("Reservation details not found or cannot be edited.");
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) : value,
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.checkInDate ||
      !formData.checkOutDate ||
      !formData.numberOfGuests
    ) {
      setError("All fields are required.");
      return;
    }
    if (new Date(formData.checkInDate) >= new Date(formData.checkOutDate)) {
      setError("Check-out date must be after check-in date.");
      return;
    }
    if (formData.numberOfGuests < 1) {
      setError("Number of guests must be at least 1.");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting edits:", { reservationId, ...formData });
    // Simulate API call to update reservation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock success/failure
    const success = true; // Math.random() > 0.2;
    if (success) {
      setSuccessMessage("Reservation updated successfully!");
      // Optionally, update the main reservation state if needed or refetch
      if (reservation) {
        setReservation((prev) =>
          prev ? ({ ...prev, ...formData } as EditableReservationDetails) : null
        );
      }
      // Consider redirecting after a short delay or providing a button to go back
      // setTimeout(() => router.push('/client/history'), 2000);
    } else {
      setError("Failed to update reservation. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 size={48} className="text-amber-400 animate-spin" />
        <p className="ml-3 text-xl text-amber-300">Loading Reservation...</p>
      </div>
    );
  }

  if (error && !reservation) {
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

  if (!reservation) {
    return (
      <div className="text-center text-amber-300 p-8">
        Reservation not found or cannot be edited.
      </div>
    ); // Should be caught by error state
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-amber-900/30 border border-amber-600/30 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl shadow-lg">
            <Edit3 className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Edit Reservation
          </h1>
        </div>
        <Link
          href="/client/history"
          className="text-sm text-amber-300 hover:text-amber-100 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>

      {/* Reservation Summary */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/70">
        <h2 className="text-lg sm:text-xl font-semibold text-amber-200">
          {reservation.hotelName}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-1">
          {reservation.roomType}
        </p>
        {reservation.hotelImageUrl && (
          <div className="w-full h-40 rounded-md overflow-hidden relative my-3">
            <img
              src={reservation.hotelImageUrl}
              alt={reservation.hotelName}
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}
        <p className="text-xs sm:text-sm text-gray-400">
          Original Stay: {formatDisplayDate(reservation.checkInDate)} -{" "}
          {formatDisplayDate(reservation.checkOutDate)}
        </p>
        <p className="text-xs sm:text-sm text-gray-400">
          Original Guests: {reservation.numberOfGuests}
        </p>
        {reservation.originalPrice && (
          <p className="text-xs sm:text-sm text-gray-400">
            Original Price: ${reservation.originalPrice.toFixed(2)}
          </p>
        )}
      </div>

      {successMessage ? (
        <div className="p-6 text-center bg-green-700/30 border border-green-500 rounded-lg">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-green-300 mb-2">
            Update Successful!
          </h2>
          <p className="text-gray-300 mb-4">{successMessage}</p>
          <Link
            href="/client/history"
            className="inline-block mt-2 px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600"
          >
            Return to Reservation History
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="checkInDate"
              className="block text-sm font-medium text-amber-300 mb-1"
            >
              New Check-in Date
            </label>
            <input
              type="date"
              id="checkInDate"
              name="checkInDate"
              value={formData.checkInDate || ""}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]} // Prevent past dates
              className="w-full px-3 py-2.5 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="checkOutDate"
              className="block text-sm font-medium text-amber-300 mb-1"
            >
              New Check-out Date
            </label>
            <input
              type="date"
              id="checkOutDate"
              name="checkOutDate"
              value={formData.checkOutDate || ""}
              onChange={handleInputChange}
              min={
                formData.checkInDate || new Date().toISOString().split("T")[0]
              } // Min checkout is checkin or today
              className="w-full px-3 py-2.5 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="numberOfGuests"
              className="block text-sm font-medium text-amber-300 mb-1"
            >
              Number of Guests
            </label>
            <input
              type="number"
              id="numberOfGuests"
              name="numberOfGuests"
              value={formData.numberOfGuests || 1}
              onChange={handleInputChange}
              min="1"
              max="10" // Example max
              className="w-full px-3 py-2.5 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-700/40 border border-red-500 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default EditReservation;
