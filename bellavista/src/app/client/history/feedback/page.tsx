// src/components/ui/client/Feedback.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react"; // Added FormEvent
import Image from "next/image"; // For Next.js Image if used (not in current provided snippet)
import Link from "next/link"; // For "Back to History" button
import { useSearchParams, useRouter } from "next/navigation"; // For getting reservationId and navigation
import {
  Star,
  MessageSquare, // Changed from MessageSquareEdit as it's not standard
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Heart,
  Coffee,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast"; // For notifications

// Reservation details this feedback is for
interface ReservationDetails {
  id: string;
  hotelName: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  hotelImageUrl?: string;
}

// MOCK: Function to fetch reservation details - REPLACE WITH ACTUAL API CALL
const fetchMockReservationDetails = async (
  id: string
): Promise<ReservationDetails | null> => {
  console.log("Fetching MOCK details for reservation ID:", id);
  await new Promise((resolve) => setTimeout(resolve, 300));
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

const FloatingOrb: React.FC<{ delay?: number; duration?: number }> = ({
  delay = 0,
  duration = 20,
}) => (
  <div
    className="absolute w-32 h-32 rounded-full opacity-20 animate-pulse" // Removed filter: blur(8px) if not desired
    style={{
      background:
        "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(245,158,11,0.2) 50%, transparent 100%)",
      animation: `float ${duration}s infinite ease-in-out ${delay}s, pulse 4s infinite ease-in-out alternate`, // Added alternate for pulse
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      transform: `scale(${0.5 + Math.random() * 0.8})`, // Random initial scale
    }}
  />
);

const ParticleEffect: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {" "}
      {/* Ensure z-index is appropriate */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-ping" // Smaller particles
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${1.5 + Math.random() * 1.5}s`,
            opacity: 0.5 + Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
};

const InteractiveStar: React.FC<{
  filled: boolean;
  onRate: () => void;
  onHover: () => void;
  onLeave: () => void;
  index: number; // For animation delay
  isHovered: boolean;
}> = ({ filled, onRate, onHover, onLeave, index, isHovered }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onRate();
    setTimeout(() => setIsClicked(false), 300); // Slightly longer for animation
  };

  return (
    <div className="relative group">
      {" "}
      {/* Added group for potential parent hover effects */}
      <Star
        size={40}
        className={`cursor-pointer transition-all duration-200 transform group-hover:opacity-100 ${
          isClicked
            ? "scale-125 text-yellow-400 fill-yellow-400"
            : isHovered
            ? "scale-110 text-amber-300 fill-amber-300/50"
            : "scale-100"
        } ${
          filled
            ? "text-amber-400 fill-amber-400"
            : "text-slate-600 hover:text-amber-300"
        }`}
        onClick={handleClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        style={{
          filter: filled
            ? "drop-shadow(0 0 10px rgba(251,191,36,0.7))"
            : "none",
        }}
      />
      {filled && (
        <Sparkles
          size={16}
          className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-ping opacity-75" // Ping instead of bounce
          style={{
            animationDelay: `${index * 0.05}s`,
            animationDuration: "1.5s",
          }}
        />
      )}
    </div>
  );
};

const ModernFeedbackPage = () => {
  // Renamed to Page for clarity if this is the page component
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(true); // For fetching reservation details
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); // Explicitly string | null
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Explicitly string | null
  const [showParticles, setShowParticles] = useState(false);

  // Inside ModernFeedbackPage.tsx
  useEffect(() => {
    if (reservationId) {
      setIsLoadingDetails(true);
      setError(null); // Good to clear previous errors

      // fetchMockReservationDetails(reservationId) // <<< THIS IS THE OLD MOCK CALL
      //   .then(data => { ... })

      // --- REPLACE WITH ACTUAL API CALL ---
      const fetchReservationForFeedback = async () => {
        try {
          console.log(
            `FEEDBACK_PAGE: Fetching /api/client/reservations/${reservationId}`
          );
          const response = await fetch(
            `/api/client/reservations/${reservationId}`
          ); // ACTUAL API CALL

          // It's good to get raw text first for debugging potential JSON parse errors
          const responseText = await response.text();
          console.log(
            `FEEDBACK_PAGE: Fetch response status: ${
              response.status
            }, text (first 200 chars): ${responseText.substring(0, 200)}`
          );

          if (!response.ok) {
            let errorMsg = `Failed to load reservation (Status: ${response.status}).`;
            try {
              // Only try to parse JSON if the server indicates it's JSON
              if (
                responseText &&
                response.headers
                  .get("content-type")
                  ?.includes("application/json")
              ) {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.message || errorMsg;
              } else if (responseText) {
                // If not JSON, use a snippet of the text or a generic message
                errorMsg = `Server error: ${responseText.substring(0, 100)}`;
              }
            } catch (e) {
              console.error(
                "FEEDBACK_PAGE: Failed to parse error response text",
                e
              );
              // errorMsg remains the status-based one
            }
            throw new Error(errorMsg);
          }

          const data: ApiReservationDetail = JSON.parse(responseText); // Parse the successful response text

          // Now check if the reservation is eligible for feedback
          if (
            data &&
            (data.status === "COMPLETED" || data.status === "CHECKED_OUT")
          ) {
            setReservation({
              id: data.id,
              hotelName: data.hotelName,
              roomType: data.roomType,
              // Convert date strings from API (YYYY-MM-DD) to Date objects for formatDate and other Date operations
              checkInDate: new Date(data.checkInDate + "T00:00:00Z"), // Assume UTC for date-only strings
              checkOutDate: new Date(data.checkOutDate + "T00:00:00Z"),
              hotelImageUrl: data.hotelImageUrl,
              status: data.status,
            });
          } else if (data) {
            // Data fetched but status is not eligible
            const statusMessage = `Feedback can only be left for completed stays. This reservation status is: ${
              data.status || "Unknown"
            }.`;
            setError(statusMessage);
            toast.error(statusMessage);
            setReservation(null); // Do not set reservation if not eligible for feedback
          } else {
            // Data itself is null or undefined after parsing (should be caught by !response.ok usually)
            const notFoundMessage =
              "Reservation details not found. Cannot leave feedback.";
            setError(notFoundMessage);
            toast.error(notFoundMessage);
            setReservation(null);
          }
        } catch (err: any) {
          console.error(
            "FEEDBACK_PAGE: Error fetching reservation details:",
            err
          );
          const errorMessage =
            err.message || "Could not load reservation information.";
          setError(errorMessage);
          toast.error(errorMessage);
          setReservation(null); // Ensure reservation is null on error
        } finally {
          setIsLoadingDetails(false);
        }
      };

      fetchReservationForFeedback(); // Call the async function
    } else {
      const noIdMessage =
        "No reservation ID provided in URL. Cannot leave feedback.";
      setError(noIdMessage);
      // toast.error("No reservation ID specified for feedback."); // Toast can be redundant if error UI shows
      setIsLoadingDetails(false);
    }
  }, [reservationId]);
  // Inside src/components/ui/client/Feedback.tsx (or src/app/client/history/feedback/page.tsx)

  // ... (imports and other component logic, ReservationDetails interface remains the same) ...

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reservation) {
      toast.error("Reservation details are missing. Cannot submit feedback.");
      setError("Reservation details are missing."); // Set local error for UI
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating.");
      setError("Please select a rating.");
      return;
    }
    // If comment is truly optional, adjust this logic
    if (!comment.trim()) {
      toast.error("Please share your thoughts in the comment box.");
      setError("Please write a comment.");
      return;
    }

    setError(null); // Clear previous errors
    setIsSubmitting(true);
    setShowParticles(true);

    try {
      // CORRECTED API ENDPOINT: Includes reservationId in the path
      const response = await fetch(
        `/api/client/reservations/${reservation.id}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // reservationId is now in the URL, so only send rating and comment
            rating: rating,
            comment: comment,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit feedback.");
      }
      setSuccessMessage(
        result.message || "Thank you! Your feedback has been submitted."
      );
      toast.success("Feedback submitted successfully!");
      // Optionally redirect or further disable form
      // router.push('/client/history');
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      const errorMessage =
        err.message ||
        "An unexpected error occurred while submitting feedback.";
      setError(errorMessage);
      toast.error(errorMessage);
      setShowParticles(false); // Stop particles on error
    } finally {
      setIsSubmitting(false);
      // Let particles show a bit longer on success before stopping, if desired
      if (successMessage) {
        // Check if successMessage was set in the try block
        setTimeout(() => setShowParticles(false), 2500);
      } else if (!successMessage && !error) {
        // If neither success nor error, means submission didn't happen or was aborted
        setShowParticles(false);
      }
    }
  };

  // ... (rest of your ModernFeedbackPage component: useEffect for fetching details, JSX, etc.) ...
  // The useEffect to fetch reservation details for context will still call:
  // GET /api/client/reservations/${reservationId}
  // (Handled by src/app/api/client/reservations/[reservationId]/route.ts's GET handler)

  const formatDate = (date: Date) => {
    // Ensure Date type
    if (!date || isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRatingEmoji = (r: number) => {
    const emojis = ["😢", "😕", "😐", "😊", "🤩"]; // Index 0-4 for rating 1-5
    return emojis[r - 1] || "";
  };

  const getRatingText = (r: number) => {
    const texts = ["Poor", "Fair", "Good", "Great", "Excellent!"];
    return texts[r - 1] || "How was your experience?";
  };

  // This is the start of the return statement that was causing issues.
  // Ensure all functions and logic above this are correctly closed and syntactically valid.
  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
        <span className="ml-4 text-xl text-slate-300">
          Loading reservation details...
        </span>
      </div>
    );
  }

  if (error && !reservation) {
    // If there's an error and no reservation data to display
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-red-500/50 shadow-2xl text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-300 mb-3">
            Oops! Error Loading
          </h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link
            href="/client/history"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-600 transition-colors"
          >
            <ArrowLeft size={18} /> Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) {
    // Should be caught by above, but as a fallback
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-amber-300">
        Reservation not found.
      </div>
    );
  }

  return (
    // <<< Line 170 (approximately) in your original error
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden font-sans text-slate-100">
      <div className="absolute inset-0">
        {[...Array(5)].map(
          (
            _,
            i // Reduced orb count for performance
          ) => (
            <FloatingOrb key={i} delay={i * 2.5} duration={18 + i * 3} />
          )
        )}
      </div>
      <ParticleEffect isActive={showParticles} />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(165, 100, 255, 0.2) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(251,191,36,0.15) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-3 mb-3 p-3 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700/50">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Share Your Experience
              </h1>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-md sm:text-lg text-slate-300 font-light">
              Your feedback for{" "}
              <span className="font-semibold text-amber-300">
                {reservation.hotelName}
              </span>{" "}
              helps us improve.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/60 shadow-xl">
              {reservation.hotelImageUrl && (
                <div className="relative overflow-hidden rounded-xl mb-4 aspect-video group">
                  <img // Using Next/Image
                    src={reservation.hotelImageUrl}
                    alt={reservation.hotelName}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-amber-200">
                {reservation.hotelName}
              </h3>
              <p className="text-sm text-slate-400">{reservation.roomType}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <p>
                  <span className="font-medium text-slate-400">Stayed:</span>{" "}
                  {formatDate(reservation.checkInDate)} -{" "}
                  {formatDate(reservation.checkOutDate)}
                </p>
              </div>
              <Link
                href="/client/history"
                className="mt-6 inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/70 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowLeft size={14} /> Back to History
              </Link>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700/60 shadow-xl">
              {successMessage ? (
                <div className="text-center py-6">
                  <div className="relative inline-block mb-4">
                    <CheckCircle
                      size={60}
                      className="text-green-400 animate-bounce"
                    />
                    <Sparkles className="absolute top-0 right-0 w-5 h-5 text-yellow-300 animate-ping" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">
                    Feedback Submitted!
                  </h2>
                  <p className="text-slate-300 mb-6">{successMessage}</p>
                  <Link
                    href="/client/history"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600 transform hover:scale-105 transition-all shadow-lg"
                  >
                    <ArrowLeft size={18} /> Back to History
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center">
                    <label className="block text-md sm:text-lg font-semibold text-amber-300 mb-3">
                      {(hoverRating || rating) > 0
                        ? getRatingText(hoverRating || rating)
                        : "How was your stay overall?"}
                    </label>
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <InteractiveStar
                          key={star}
                          filled={(hoverRating || rating) >= star}
                          onRate={() => setRating(star)}
                          onHover={() => setHoverRating(star)}
                          onLeave={() => setHoverRating(0)}
                          index={star}
                          isHovered={hoverRating >= star && hoverRating !== 0} // More precise hover indication
                        />
                      ))}
                    </div>
                    {(rating || hoverRating) > 0 && (
                      <div
                        className="text-3xl sm:text-4xl h-10 flex items-center justify-center transition-opacity duration-300"
                        style={{ opacity: (rating || hoverRating) > 0 ? 1 : 0 }}
                      >
                        {getRatingEmoji(hoverRating || rating)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="comment"
                      className="block text-md sm:text-lg font-semibold text-amber-300 mb-3"
                    >
                      Share more details (optional)
                    </label>
                    <div className="relative">
                      <textarea
                        id="comment" // Added id for label association
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="What did you love? What could be improved?"
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/70 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/50 outline-none transition-colors text-white placeholder-slate-400 resize-none h-36 sm:h-40"
                        // Removed 'required' as per "optional" label
                      />
                      <Heart className="absolute bottom-3 right-3 w-4 h-4 text-pink-500 opacity-60" />
                    </div>
                  </div>

                  {error && ( // Display submission error
                    <div className="p-3 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl text-sm text-center animate-shake">
                      <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || rating === 0} // Disable if no rating
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-bold text-md sm:text-lg hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={22} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Feedback{" "}
                          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 opacity-50 group-hover:opacity-0" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes need to be within a <style jsx> or <style jsx global> tag if used this way */}
      {/* Or defined in your global CSS file */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-3px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(3px);
          }
        }
        /* Ensure animate-bounce is defined if you use it, or use Tailwind's default */
        .animate-bounce {
          animation: bounce 1s infinite;
        } /* Tailwind's bounce or define your own */
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(-15%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default ModernFeedbackPage;
