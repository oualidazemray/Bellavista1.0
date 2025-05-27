// src/app/client/history/edit/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image"; // Using Next/Image
import Link from "next/link";
import {
  Edit3,
  CalendarDays,
  Users,
  BedDouble,
  Save,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Hotel,
  DollarSign,
  Clock,
  Info,
  Sparkles,
  Calendar,
  UserCheck,
  MapPin,
  Star,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast"; // Assuming you use react-hot-toast

// Interface for the data structure received from the backend API
// and used to pre-fill the form and display summary.
interface ApiReservationDetailItem {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: string; // YYYY-MM-DD string from API
  checkOutDate: string; // YYYY-MM-DD string from API
  numberOfGuests: number;
  hotelImageUrl?: string | null;
  originalPrice?: number; // This was from your mock, API returns totalPrice
  totalPrice: number; // Actual total price from API
  canEdit: boolean; // Crucial flag from API
  cancellationPolicyDetails?: string; // From API
  currentRoomsInfo?: {
    id: string;
    name: string;
    type: string;
    maxGuests: number | null;
    pricePerNight: number;
  }[]; // From API
  // Add any other fields your GET /api/client/reservations/[id] returns
}

// Interface for the form data state
interface EditReservationFormData {
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  // Add other fields that are directly editable in the form
  // e.g., specialRequests?: string;
}

const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  // Ensure dateString is treated as UTC to avoid off-by-one day issues due to local timezone.
  // Appending 'T00:00:00Z' or parsing carefully is important.
  // For YYYY-MM-DD, splitting and creating a new Date object is safer across browsers.
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const date = new Date(
      Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    );
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      timeZone: "UTC", // Display in UTC or user's local, be consistent
    });
  }
  return "Invalid Date";
};

const EditReservation = () => {
  // Renamed component to Page convention
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  // State for the full reservation details fetched from API
  const [reservationDetails, setReservationDetails] =
    useState<ApiReservationDetailItem | null>(null);
  // State for the form data that can be edited
  const [formData, setFormData] = useState<EditReservationFormData>({
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (reservationId && typeof reservationId === "string") {
      setIsLoading(true);
      setError(null); // Clear previous errors

      const loadReservationDetails = async () => {
        try {
          console.log(
            `EDIT_PAGE: Fetching /api/client/reservations/${reservationId}`
          );
          const response = await fetch(
            `/api/client/reservations/${reservationId}`
          );
          const responseText = await response.text(); // Get raw response text first
          console.log(
            `EDIT_PAGE: Fetch response status: ${
              response.status
            }, text: ${responseText.substring(0, 200)}...`
          );

          if (!response.ok) {
            let errorMsg = `Failed to load reservation (Status: ${response.status}).`;
            try {
              if (
                responseText &&
                response.headers
                  .get("content-type")
                  ?.includes("application/json")
              ) {
                const errorData = JSON.parse(responseText); // Manually parse if needed
                errorMsg = errorData.message || errorMsg;
              } else if (responseText) {
                errorMsg = responseText.substring(0, 100); // Show part of text if not JSON
              }
            } catch (e) {
              console.error("EDIT_PAGE: Failed to parse error response:", e);
            }
            throw new Error(errorMsg);
          }

          const data: ApiReservationDetailItem = JSON.parse(responseText); // Parse text to JSON

          if (data && data.canEdit === true) {
            setReservationDetails(data);
            setFormData({
              checkInDate: data.checkInDate, // API should return YYYY-MM-DD
              checkOutDate: data.checkOutDate, // API should return YYYY-MM-DD
              numberOfGuests: data.numberOfGuests,
            });
            setHasChanges(false); // Reset changes flag
          } else if (data && data.canEdit === false) {
            setError(
              "This reservation cannot be edited at this time according to policy."
            );
            setReservationDetails(data); // Still set details to display them, but form won't be active
          } else {
            setError(
              "Reservation details not found or cannot be processed for editing."
            );
            setReservationDetails(null);
          }
        } catch (err: any) {
          console.error("EDIT_PAGE: Error fetching reservation for edit:", err);
          setError(
            err.message ||
              "An unexpected error occurred while loading reservation details."
          );
          setReservationDetails(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadReservationDetails();
    } else {
      setError("Reservation ID is missing in URL.");
      setIsLoading(false);
    }
  }, [reservationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? parseInt(value, 10) || 0 : value; // Ensure number parse or default

    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: newValue };

      // Check for changes against original reservation details
      if (reservationDetails) {
        const originalValue =
          reservationDetails[name as keyof ApiReservationDetailItem];
        // For dates, they are already YYYY-MM-DD strings, so direct comparison is fine.
        // For numbers, ensure type consistency.
        const formValueForCompare =
          name === "numberOfGuests"
            ? Number(updatedFormData[name as keyof typeof updatedFormData])
            : updatedFormData[name as keyof typeof updatedFormData];
        const originalValueForCompare =
          name === "numberOfGuests" ? Number(originalValue) : originalValue;

        let changed = false;
        if (formValueForCompare !== originalValueForCompare) {
          changed = true;
        }
        // Check other fields in formData against reservationDetails to set hasChanges
        // This can be simplified if formData only contains editable fields
        const currentChanges =
          updatedFormData.checkInDate !== reservationDetails.checkInDate ||
          updatedFormData.checkOutDate !== reservationDetails.checkOutDate ||
          updatedFormData.numberOfGuests !== reservationDetails.numberOfGuests;
        setHasChanges(currentChanges);
      }
      return updatedFormData;
    });
    setError(null); // Clear errors on input change
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!reservationDetails || !reservationDetails.canEdit) {
      setError("This reservation cannot be edited.");
      return;
    }

    if (
      !formData.checkInDate ||
      !formData.checkOutDate ||
      (formData.numberOfGuests !== undefined && formData.numberOfGuests < 1)
    ) {
      setError(
        "Check-in date, check-out date, and at least 1 guest are required."
      );
      return;
    }
    const newCheckIn = new Date(formData.checkInDate + "T00:00:00"); // Add time part to avoid timezone issues with date-only strings
    const newCheckOut = new Date(formData.checkOutDate + "T00:00:00");
    if (newCheckIn >= newCheckOut) {
      setError("Check-out date must be after check-in date.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newCheckIn < today) {
      setError("Check-in date cannot be in the past.");
      return;
    }

    // Max guest check (if API provided maxRoomGuests)
    if (
      reservationDetails.currentRoomsInfo &&
      reservationDetails.currentRoomsInfo[0]?.maxGuests &&
      formData.numberOfGuests
    ) {
      if (
        formData.numberOfGuests >
        reservationDetails.currentRoomsInfo[0].maxGuests
      ) {
        setError(
          `Number of guests exceeds room capacity (${reservationDetails.currentRoomsInfo[0].maxGuests}).`
        );
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      checkInDate: formData.checkInDate, // Send as YYYY-MM-DD string
      checkOutDate: formData.checkOutDate, // Send as YYYY-MM-DD string
      numberOfGuests: formData.numberOfGuests,
      // Add other fields from formData if they are part of EditReservationRequestBody
    };
    console.log("EDIT_PAGE: Submitting edits:", { reservationId, ...payload });

    try {
      const response = await fetch(
        `/api/client/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update reservation.");
      }

      setSuccessMessage(result.message || "Reservation updated successfully!");
      // Update local reservationDetails and formData to reflect saved changes
      if (result.reservation) {
        // Assuming API returns updated reservation
        const updatedApiData: ApiReservationDetailItem = {
          // Map backend response to local type
          ...reservationDetails, // Keep old non-editable fields
          ...result.reservation, // Override with new data from API
          checkInDate: result.reservation.checkIn.split("T")[0], // Ensure YYYY-MM-DD
          checkOutDate: result.reservation.checkOut.split("T")[0],
          numberOfGuests:
            result.reservation.numAdults +
            (result.reservation.numChildren || 0),
          // Re-calculate canEdit/canCancel if backend doesn't return them on PUT response
          canEdit:
            result.reservation.canEdit !== undefined
              ? result.reservation.canEdit
              : reservationDetails.canEdit,
        };
        setReservationDetails(updatedApiData);
        setFormData({
          checkInDate: updatedApiData.checkInDate,
          checkOutDate: updatedApiData.checkOutDate,
          numberOfGuests: updatedApiData.numberOfGuests,
        });
      }
      setHasChanges(false); // Reset after successful save
      // Optionally, navigate away or show a persistent success message
      // setTimeout(() => router.push('/client/history'), 3000);
    } catch (err: any) {
      console.error("EDIT_PAGE: Error submitting reservation edits:", err);
      setError(
        err.message || "An unexpected error occurred while saving changes."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNights = () => {
    /* ... (keep your existing calculateNights) ... */
  };
  const estimatedNewPrice = () => {
    /* ... (keep your existing estimatedNewPrice, ensure reservationDetails is used) ... */
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    /* ... (your loading UI) ... */
  }

  // This is the error UI from your image
  if (error && !successMessage) {
    // Show error if not showing success
    return (
      <div className="relative min-h-screen w-full bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0">
          <Image
            src="/beachBack.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-gray-900/90 opacity-95" />
        </div>
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/50 p-8 sm:p-10 text-center shadow-2xl shadow-red-800/30">
            <div className="relative inline-block mb-6">
              <AlertTriangle size={60} className="text-red-400" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-red-300 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              {error} {/* Display the error message from state */}
            </p>
            <Link
              href="/client/history"
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-base hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft size={20} /> Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!reservationDetails) {
    // If still no reservation details after loading and no specific error for display
    return (
      <div className="flex items-center justify-center min-h-screen text-amber-300 p-8">
        No reservation data available to edit. Please try again.
      </div>
    );
  }

  // --- Main Edit Form JSX ---
  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/beachBack.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-gray-900/90 opacity-95" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-6 shadow-2xl shadow-amber-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl shadow-lg">
                  <Edit3 className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 bg-clip-text text-transparent">
                    Edit Reservation
                  </h1>
                  <p className="text-amber-300/80 mt-1">
                    Refine your upcoming stay
                  </p>
                </div>
              </div>
              <Link
                href="/client/history"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-amber-300 hover:text-amber-100 hover:bg-black/20 transition-colors border border-amber-500/30"
              >
                <ArrowLeft size={16} />{" "}
                <span className="text-sm">Back to History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Current Reservation Summary */}
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-blue-300 mb-4">
              Current Booking Details
            </h2>
            {reservationDetails.hotelImageUrl && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 group">
                <img
                  src={reservationDetails.hotelImageUrl}
                  alt={reservationDetails.hotelName}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <h3 className="text-lg font-semibold text-amber-200">
              {reservationDetails.hotelName}
            </h3>
            <p className="text-sm text-gray-300 mb-1">
              {reservationDetails.roomType}
            </p>
            <p className="text-sm text-gray-400">
              Check-in: {formatDisplayDate(reservationDetails.checkInDate)}
            </p>
            <p className="text-sm text-gray-400">
              Check-out: {formatDisplayDate(reservationDetails.checkOutDate)}
            </p>
            <p className="text-sm text-gray-400">
              Guests: {reservationDetails.numberOfGuests}
            </p>
            <p className="text-lg font-semibold text-green-400 mt-2">
              Price: ${reservationDetails.totalPrice.toFixed(2)}
            </p>
            {reservationDetails.cancellationPolicyDetails && (
              <p className="text-xs text-gray-500 mt-3">
                {reservationDetails.cancellationPolicyDetails}
              </p>
            )}
            {!reservationDetails.canEdit &&
              error && ( // If canEdit is false from API, show the reason
                <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm">
                  {error}{" "}
                  {/* This 'error' state would be set if canEdit is false */}
                </div>
              )}
          </div>

          {/* Right: Edit Form */}
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6 shadow-xl">
            {successMessage ? (
              <div className="text-center py-8">
                {/* ... Success Message UI ... */}
                <CheckCircle
                  size={64}
                  className="text-green-400 mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-green-300 mb-4">
                  Update Successful!
                </h2>
                <p className="text-gray-300 mb-8">{successMessage}</p>
                <Link
                  href="/client/history"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
                >
                  Return to History
                </Link>
              </div>
            ) : reservationDetails.canEdit ? ( // Only show form if canEdit is true
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-bold text-amber-300 mb-4">
                  Modify Your Stay
                </h2>
                {/* Form Fields (Check-in, Check-out, Guests) */}
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
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50 focus:ring-amber-500 text-white"
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
                      formData.checkInDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50 focus:ring-amber-500 text-white"
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
                    max={
                      reservationDetails.currentRoomsInfo?.[0]?.maxGuests || 10
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600/50 focus:ring-amber-500 text-white"
                    required
                  />
                  {reservationDetails.currentRoomsInfo?.[0]?.maxGuests && (
                    <p className="text-xs text-gray-400 mt-1">
                      Room capacity:{" "}
                      {reservationDetails.currentRoomsInfo[0].maxGuests} guests
                    </p>
                  )}
                </div>

                {/* Error display within form */}
                {error && (
                  <div className="p-3 bg-red-600/30 border border-red-500 text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className={`w-full flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                      isSubmitting || !hasChanges
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-600 hover:to-orange-600"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" /> Processing...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                  {!hasChanges && !isSubmitting && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Make a change to enable saving.
                    </p>
                  )}
                </div>
              </form>
            ) : (
              // This case is if reservationDetails exist but reservationDetails.canEdit is false
              <div className="text-center py-8">
                <Info size={48} className="mx-auto text-blue-400 mb-4" />
                <h2 className="text-xl font-semibold text-blue-300 mb-2">
                  Cannot Edit Reservation
                </h2>
                <p className="text-gray-300">
                  This reservation cannot be modified at this time. Please check
                  the hotel's policy or contact support.
                  {reservationDetails.cancellationPolicyDetails && (
                    <span className="block mt-2 text-xs">
                      {reservationDetails.cancellationPolicyDetails}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditReservation;
