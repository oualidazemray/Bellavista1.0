// src/app/client/payment/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // For potential redirects
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  CreditCard,
  CalendarDays,
  Users,
  Hotel as HotelIcon,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { CartItemData } from "../reservations/page"; // Assuming CartItemData is exported from RoomsPage or a shared types file

// Interface for the data expected on this page (from localStorage)
// This should match or be derivable from CartItemData[]
interface BookingSummary {
  items: CartItemData[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  currency: string;
}

const PaymentPage = () => {
  const router = useRouter();
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true); // For any initial loading on this page
  const [isProcessing, setIsProcessing] = useState(false); // For payment processing
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment form states (simplified)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    const cartDataString = localStorage.getItem("bookingCart");
    if (cartDataString) {
      try {
        const parsedCartItems: CartItemData[] = JSON.parse(cartDataString);
        if (parsedCartItems && parsedCartItems.length > 0) {
          // Recalculate totals here to ensure consistency, or trust localStorage if set carefully
          let subtotal = 0;
          let totalTax = 0;
          parsedCartItems.forEach((item) => {
            subtotal += item.itemTotalPrice;
            totalTax += item.itemTax;
          });
          const grandTotal = subtotal + totalTax;

          setBookingSummary({
            items: parsedCartItems,
            subtotal,
            totalTax,
            grandTotal,
            currency: parsedCartItems[0].currency || "MAD",
          });
        } else {
          setError(
            "Your booking selection is empty. Redirecting to reservations..."
          );
          toast.error("Booking cart is empty!");
          setTimeout(() => router.replace("/client/reservations"), 2000);
        }
      } catch (e) {
        console.error("Error parsing booking cart from localStorage:", e);
        setError("Could not load your booking details. Please try again.");
        toast.error("Error loading booking details.");
      }
    } else {
      setError("No booking details found. Redirecting to reservations...");
      toast.error("No booking details found!");
      setTimeout(() => router.replace("/client/reservations"), 2000);
    }
    setIsLoading(false);
  }, [router]);

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingSummary || bookingSummary.items.length === 0) {
      toast.error("No items to book.");
      return;
    }
    // Basic validation for payment form
    if (!cardName || !cardNumber || !expiryDate || !cvc) {
      toast.error("Please fill in all payment details.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Prepare data for the backend reservation creation API
    const reservationPayload = {
      bookingItems: bookingSummary.items.map((item) => ({
        // Send essential info for each item
        roomId: item.roomId,
        arrivalDate: item.arrivalDate,
        departureDate: item.departureDate,
        nights: item.nights,
        adults: item.adults,
        children: item.children,
        pricePerNight: item.pricePerNight, // For verification
        itemTotalPrice: item.itemTotalPrice, // For verification
      })),
      totalPrice: bookingSummary.grandTotal, // Final total for verification
      currency: bookingSummary.currency,
      paymentDetails: {
        // This would be tokenized by a real payment gateway
        cardName,
        // DO NOT SEND RAW CARD NUMBER TO YOUR BACKEND unless you are PCI compliant.
        // Instead, use Stripe Elements, Braintree, etc., to get a paymentMethodId or token.
        paymentMethodToken: "tok_mock_payment_method_for_demo", // Replace with actual token
      },
    };

    console.log(
      "PAYMENT_PAGE: Submitting reservation payload:",
      reservationPayload
    );

    try {
      // This is where you'll call the API to create the reservation
      // The endpoint will be something like POST /api/client/reservations/create
      // (or just POST /api/client/reservations if that's your create endpoint)
      const response = await fetch("/api/client/reservations/payment", {
        // Assuming this is your "create reservation" endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create reservation.");
      }

      toast.success(result.message || "Reservation created successfully!");
      setPaymentSuccess(true);
      localStorage.removeItem("bookingCart"); // Clear cart on success
      // router.push(`/client/history/confirmation?reservationId=${result.reservation.id}`); // Redirect to a confirmation page
    } catch (err: any) {
      console.error("PAYMENT_PAGE: Error creating reservation:", err);
      setError(
        err.message ||
          "An unexpected error occurred while creating your reservation."
      );
      toast.error(err.message || "Reservation creation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />{" "}
        <span className="ml-3 text-amber-300">Loading booking...</span>
      </div>
    );
  }

  if (error && !paymentSuccess) {
    // Show error if there's an error and payment hasn't succeeded
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-400 mb-3">
            Booking Error
          </h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link
            href="/client/reservations"
            className="px-6 py-2 bg-amber-500 text-black rounded hover:bg-amber-600"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess && bookingSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-lg">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-semibold text-green-400 mb-3">
            Booking Confirmed!
          </h2>
          <p className="text-slate-300 mb-2">
            Thank you for your reservation at Bellavista.
          </p>
          <p className="text-slate-400 text-sm mb-6">
            A confirmation email has been sent to you with your booking details.
          </p>
          <div className="text-left bg-slate-700/50 p-4 rounded-md mb-6">
            <h3 className="text-lg font-semibold text-amber-300 mb-2">
              Your Booking Summary:
            </h3>
            {bookingSummary.items.map((item) => (
              <div
                key={item.roomId + item.arrivalDate}
                className="text-sm text-slate-300 border-b border-slate-600 py-1 last:border-b-0"
              >
                <p>
                  <span className="font-semibold">{item.title}</span> (
                  {item.nights} nights)
                </p>
                <p>
                  Dates: {new Date(item.arrivalDate).toLocaleDateString()} -{" "}
                  {new Date(item.departureDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            <p className="text-md font-bold text-amber-200 mt-3">
              Total: {bookingSummary.grandTotal} {bookingSummary.currency}
            </p>
          </div>
          <Link
            href="/client/history"
            className="px-8 py-3 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-semibold"
          >
            View My Reservations
          </Link>
        </div>
      </div>
    );
  }

  if (!bookingSummary) {
    // If bookingSummary is null after loading and no specific error shown
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-amber-300">
        Could not load booking summary.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 text-white py-8 px-4">
      {/* Background elements can be added here like other pages if desired */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/client/reservations"
            className="flex items-center gap-2 text-amber-300 hover:text-amber-100"
          >
            <ArrowLeft size={20} /> Back to Room Selection
          </Link>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Confirm & Pay
          </h1>
          <div></div> {/* Spacer */}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-xl border border-slate-700">
            <h2 className="text-2xl font-semibold text-amber-300 mb-4 border-b border-slate-700 pb-2">
              Order Summary
            </h2>
            {bookingSummary.items.map((item) => (
              <div
                key={item.roomId + item.arrivalDate}
                className="mb-3 pb-3 border-b border-slate-700 last:border-b-0 last:pb-0 last:mb-0"
              >
                <div className="flex items-center gap-3 mb-1">
                  <HotelIcon size={18} className="text-amber-400" />
                  <h3 className="font-semibold text-lg text-slate-100">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-300 ml-7">
                  {item.roomType || `Nights: ${item.nights}`}
                </p>{" "}
                {/* Assuming roomType is available in CartItemData */}
                <div className="text-xs text-slate-400 ml-7">
                  <p>
                    <CalendarDays size={14} className="inline mr-1" />{" "}
                    {new Date(item.arrivalDate).toLocaleDateString()} -{" "}
                    {new Date(item.departureDate).toLocaleDateString()}
                  </p>
                  <p>
                    <Users size={14} className="inline mr-1" /> {item.adults}{" "}
                    Adult(s)
                    {item.children > 0 ? `, ${item.children} Child(ren)` : ""}
                  </p>
                </div>
                <p className="text-right font-semibold text-amber-200 text-md mt-1">
                  {item.itemTotalPrice.toFixed(2)} {item.currency}
                </p>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Subtotal:</span>
                <span>
                  {bookingSummary.subtotal} {bookingSummary.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Taxes & Fees:</span>
                <span>
                  {bookingSummary.totalTax} {bookingSummary.currency}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-amber-300">
                <span>Total:</span>
                <span>
                  {bookingSummary.grandTotal} {bookingSummary.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-xl border border-slate-700">
            <h2 className="text-2xl font-semibold text-amber-300 mb-6 border-b border-slate-700 pb-2">
              <Lock size={22} className="inline mr-2 text-amber-400" /> Secure
              Payment
            </h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="cardName"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Name on Card
                </label>
                <input
                  type="text"
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label
                  htmlFor="cardNumber"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Card Number
                </label>
                {/* In a real app, use Stripe Elements or similar for PCI compliance */}
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    required
                    className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                  <CreditCard
                    size={18}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cvc"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="•••"
                    required
                    className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Lock size={18} className="mr-2" />
                )}
                {isProcessing
                  ? "Processing Payment..."
                  : `Pay ${bookingSummary.grandTotal} ${bookingSummary.currency}`}
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-4 text-center">
              By clicking "Pay", you agree to Bellavista's Terms of Service and
              Privacy Policy. All transactions are secure and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
