// src/app/client/reservations/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // For background, logo, etc.
import Link from "next/link"; // For internal navigation
import {
  SlidersHorizontal,
  Hotel, // Renamed from HotelIcon to avoid conflict if you have type Hotel
  CalendarDays,
  Users,
  Receipt,
  BadgeEuro,
  CheckCircle,
  XCircle,
  Check,
  Loader2,
  Search,
  // Filter icon isn't directly used in the button, SlidersHorizontal is.
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // If you keep framer-motion for buttons/transitions
import toast from "react-hot-toast"; // For notifications

import RoomCard from "@/components/ui/client/RoomCard"; // Adjust path as needed
import HotelFilter, { FilterState } from "@/components/ui/client/FilterRoom"; // Adjust path
import BookingSection, {
  BookingParams,
} from "@/components/layout/bookingForLanding/BookingSection"; // Adjust path

// Interface for individual room data fetched from API
export interface RoomData {
  id: string;
  imageUrl?: string | null; // Primary image for the card
  imageUrls?: string[]; // Gallery images (if RoomCard supports it)
  name: string; // Room name/title
  description?: string | null;
  price: number; // Price per night
  beds?: number | null;
  bedType: string; // Derived descriptive string like "1 King Bed"
  guests: number; // Max guests this room can accommodate
  view?: string | null; // e.g., "Ocean", "City"
  characteristics?: string[]; // Array of amenities like "wifi", "ac"
  sqMeters?: number | null;
  rating?: number | null;
  featured?: boolean;
  currency?: string; // e.g., "MAD"
  perNightText?: string; // e.g., "/ night"
  includesFeesText?: string; // e.g., "Taxes included"
}

// Initial state for the filter panel
const initialFilterState: FilterState = {
  sortBy: "recommended", // Default sort
  display: "rooms", // Assuming this is for filter panel internal use
  view: [],
  bedType: [],
  characteristics: [],
  maxPrice: "10000", // Default max price for slider
  priceRange: 10000,
};

// Interface for items stored in the cart
export interface CartItemData {
  roomId: string;
  title: string; // Room name
  pricePerNight: number;
  currency: string;
  arrivalDate: string; // ISO string
  departureDate: string; // ISO string
  nights: number;
  adults: number;
  children: number;
  itemTotalPrice: number; // pricePerNight * nights
  itemTax: number; // Calculated or fixed tax for this item
  imageUrl?: string | null; // For display in cart/summary
}

export default function RoomsPage() {
  const router = useRouter();
  const [fetchedRooms, setFetchedRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [initialSearchTriggered, setInitialSearchTriggered] = useState(false); // Tracks if first search happened

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [currentBookingParams, setCurrentBookingParams] =
    useState<BookingParams | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersInPanel, setActiveFiltersInPanel] = useState<FilterState>(
    { ...initialFilterState }
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    ...initialFilterState,
  });

  const fetchRoomsFromAPI = useCallback(
    async (bookingParams: BookingParams | null, filters: FilterState) => {
      if (
        !bookingParams ||
        !bookingParams.arrivalDate ||
        !bookingParams.departureDate
      ) {
        // Don't fetch if essential date params are missing
        setFetchedRooms([]);
        // setInitialSearchTriggered(false); // Keep true if a search was attempted but params became invalid
        if (isLoadingRooms) setIsLoadingRooms(false); // Ensure loading stops
        return;
      }

      setIsLoadingRooms(true);
      setFetchError(null);
      if (!initialSearchTriggered) setInitialSearchTriggered(true); // Mark that a search has been initiated

      const query = new URLSearchParams({
        arrivalDate: bookingParams.arrivalDate.toISOString(),
        departureDate: bookingParams.departureDate.toISOString(),
        adults: bookingParams.adults.toString(),
        children: bookingParams.children.toString(),
        priceRange: filters.priceRange.toString(),
        sortBy: filters.sortBy,
      });
      if (filters.view.length > 0) query.set("view", filters.view.join(","));
      if (filters.bedType.length > 0)
        query.set("bedType", filters.bedType.join(","));
      if (filters.characteristics.length > 0)
        query.set("characteristics", filters.characteristics.join(","));

      const apiUrl = `/api/reservations/rooms?${query.toString()}`;
      console.log("[RoomsPage] Fetching rooms from:", apiUrl);

      try {
        const response = await fetch(apiUrl);
        const responseText = await response.text(); // Get raw text first

        if (!response.ok) {
          let errMsg = `API Error (${response.status})`;
          try {
            if (
              responseText &&
              response.headers.get("content-type")?.includes("application/json")
            ) {
              const errData = JSON.parse(responseText);
              errMsg = errData.message || errData.error || errMsg;
              if (errData.details)
                errMsg += ` Details: ${JSON.stringify(errData.details)}`;
            } else if (responseText) {
              errMsg = `${errMsg}: ${responseText.substring(0, 100)}`;
            }
          } catch (e) {
            /* Ignore parsing error of error response */
          }
          throw new Error(errMsg);
        }
        const data: RoomData[] = JSON.parse(responseText);
        console.log("[RoomsPage] API Success. Rooms received:", data.length);
        setFetchedRooms(data);
      } catch (error) {
        console.error("[RoomsPage] Fetch Error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching rooms.";
        setFetchError(errorMessage);
        toast.error(errorMessage);
        setFetchedRooms([]); // Clear rooms on error
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [initialSearchTriggered] // Re-create if initialSearchTriggered changes (though it mostly goes true once)
  );

  const handleBookingParamsSearch = useCallback(
    (params: BookingParams) => {
      console.log("[RoomsPage] New booking params search:", params);
      setCurrentBookingParams(params);
      // When new dates/guests are searched, use the currently applied filters
      fetchRoomsFromAPI(params, appliedFilters);
    },
    [fetchRoomsFromAPI, appliedFilters]
  );

  const handleApplyFiltersClick = useCallback(() => {
    console.log("[RoomsPage] Applying filters:", activeFiltersInPanel);
    const newApplied = { ...activeFiltersInPanel };
    setAppliedFilters(newApplied);
    setShowFilters(false);
    if (currentBookingParams) {
      // Only fetch if we have valid booking params
      fetchRoomsFromAPI(currentBookingParams, newApplied);
    } else {
      toast.error("Please select dates and guests before applying filters.");
    }
  }, [fetchRoomsFromAPI, currentBookingParams, activeFiltersInPanel]);

  const openFilterPanel = () => {
    if (!initialSearchTriggered || !currentBookingParams) {
      toast.error(
        "Please perform an initial search (select dates and guests) before filtering."
      );
      return;
    }
    setActiveFiltersInPanel({ ...appliedFilters }); // Load current applied filters into panel
    setShowFilters(true);
  };

  const handlePanelFiltersChange = (newFilters: FilterState) => {
    setActiveFiltersInPanel(newFilters);
  };

  const handleCancelFiltersClick = () => {
    setActiveFiltersInPanel({ ...appliedFilters }); // Reset panel to last applied filters
    setShowFilters(false);
  };

  const handleReserve = (room: RoomData) => {
    if (
      !currentBookingParams ||
      !currentBookingParams.arrivalDate ||
      !currentBookingParams.departureDate
    ) {
      toast.error(
        "Booking dates are not set. Please search with dates first.",
        { icon: "⚠️" }
      );
      return;
    }
    const arrival = currentBookingParams.arrivalDate;
    const departure = currentBookingParams.departureDate;
    const nights = Math.max(
      0,
      Math.ceil(
        (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    if (nights <= 0) {
      toast.error("Invalid date range for booking.", { icon: "⚠️" });
      return;
    }

    const newItem: CartItemData = {
      roomId: room.id,
      title: room.name,
      pricePerNight: room.price,
      currency: room.currency || "MAD",
      arrivalDate: arrival.toISOString(),
      departureDate: departure.toISOString(),
      nights: nights,
      adults: currentBookingParams.adults,
      children: currentBookingParams.children,
      itemTotalPrice: room.price * nights,
      itemTax: 99.0, // Example fixed tax, replace with actual calculation
      imageUrl: room.imageUrl,
    };
    setCartItems((prev) => [...prev, newItem]);
    toast.success(`${room.name} added to your selection!`, { icon: "🎉" });
  };

  const calculateCartTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    cartItems.forEach((item) => {
      subtotal += item.itemTotalPrice;
      totalTax += item.itemTax;
    });
    const grandTotal = subtotal + totalTax;
    return {
      subtotal: subtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      currency: cartItems.length > 0 ? cartItems[0].currency : "MAD",
    };
  }, [cartItems]);

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Please select a room first.");
      return;
    }
    localStorage.setItem("bookingCart", JSON.stringify(cartItems));
    router.push("/client/payment");
  };

  // Filtered and sorted rooms for display
  const displayedRooms = useMemo(() => {
    // Client-side filtering/sorting can be done here if API doesn't do it all,
    // but for now, assuming API handles most of it.
    // This useMemo is mainly just returning fetchedRooms.
    return fetchedRooms;
  }, [fetchedRooms]);

  return (
    <div
      className="min-h-screen bg-cover bg-center font-cormorant relative"
      style={{
        backgroundImage: "url('/GalleryBack.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />{" "}
      {/* Slightly increased opacity and added blur */}
      {/* Booking Section - ensure it's above the main content flow or positioned correctly */}
      <div className="relative z-20">
        {" "}
        {/* Higher z-index for booking section */}
        <BookingSection
          onCheckAvailability={handleBookingParamsSearch}
          isLoading={isLoadingRooms}
        />
      </div>
      {/* Main Content Area */}
      <div className="relative z-10 max-w-[1900px] mx-auto pt-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 px-4 md:px-8">
          <button
            className="flex items-center gap-2 border-2 border-[#e5c882] rounded-md px-6 py-2 text-[#e5c882] text-lg sm:text-xl font-medium hover:bg-[#e5c882] hover:text-[#201a15] transition bg-transparent disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-center shadow-md hover:shadow-lg hover:shadow-[#e5c882]/30"
            onClick={openFilterPanel}
            disabled={!initialSearchTriggered || isLoadingRooms} // Disable if no initial search or loading
          >
            FILTRE
            <SlidersHorizontal size={20} />
          </button>
          <div className="flex flex-col items-center text-center md:text-left md:items-start">
            <span className="tracking-widest text-md md:text-lg text-[#e5c882] font-light">
              EXPLORE OUR
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-[#e5c882] leading-none">
              SIGNATURE ROOMS
            </h1>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && initialSearchTriggered && (
            <motion.div
              key="filter-panel"
              initial={{ opacity: 0, y: -30, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -30, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mb-8 px-4 md:px-8 overflow-hidden"
            >
              <div className="bg-[#15100a]/90 backdrop-blur-md p-6 rounded-xl border border-[#e5c882]/50">
                <HotelFilter
                  filters={activeFiltersInPanel}
                  onFiltersChange={handlePanelFiltersChange}
                  onClose={handleCancelFiltersClick} // Pass cancel to HotelFilter's own close button
                  isOverlay={false} // Assuming it's not an overlay here
                />
                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                    onClick={handleApplyFiltersClick}
                    disabled={isLoadingRooms}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto border-2 border-green-500 bg-green-600/80 hover:bg-green-500/80 rounded-md px-6 py-2.5 text-white text-md font-medium transition disabled:opacity-50 shadow-lg hover:shadow-green-500/30"
                  >
                    {" "}
                    <Check size={20} /> Appliquer Filtres{" "}
                  </button>
                  <button
                    onClick={handleCancelFiltersClick} // This button is specific to closing the panel here
                    disabled={isLoadingRooms}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto border-2 border-red-500 bg-red-600/80 hover:bg-red-500/80 rounded-md px-6 py-2.5 text-white text-md font-medium transition disabled:opacity-50 shadow-lg hover:shadow-red-500/30"
                  >
                    {" "}
                    <XCircle size={20} /> Annuler{" "}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rooms List and Cart */}
        <div className="flex flex-col lg:flex-row gap-8 px-4 md:px-8">
          {/* Room Listing Area */}
          <div className="flex-1 min-h-[400px]">
            {" "}
            {/* Ensures this area takes space */}
            {isLoadingRooms && (
              <div className="flex flex-col justify-center items-center h-full text-center py-10">
                <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                <p className="text-xl text-amber-300">
                  Searching for your perfect room...
                </p>
              </div>
            )}
            {!isLoadingRooms && fetchError && (
              <div className="text-center py-10 bg-red-900/50 backdrop-blur-sm border border-red-700/70 rounded-xl p-6 shadow-lg">
                <p className="text-xl text-red-300 font-semibold">
                  Failed to Load Rooms
                </p>
                <p className="text-md text-red-400 mt-2">{fetchError}</p>
                <button
                  onClick={() =>
                    fetchRoomsFromAPI(currentBookingParams, appliedFilters)
                  }
                  className="mt-4 px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-600"
                >
                  Try Again
                </button>
              </div>
            )}
            {!isLoadingRooms &&
              !fetchError &&
              initialSearchTriggered &&
              displayedRooms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6">
                  {displayedRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      {...room} // Spread all room data to RoomCard
                      onReserve={() => handleReserve(room)}
                      onDetails={() =>
                        alert(
                          `Details for: ${room.name}\n${
                            room.description || "No description."
                          }`
                        )
                      }
                      className="w-full" // Ensure RoomCard can take full width of its grid cell
                    />
                  ))}
                </div>
              )}
            {!isLoadingRooms &&
              !fetchError &&
              initialSearchTriggered &&
              displayedRooms.length === 0 && (
                <div className="text-center py-10 bg-[#1a130e]/80 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col justify-center items-center min-h-[300px] border border-[#e5c882]/30">
                  <p className="text-xl md:text-2xl text-[#e5c882] font-semibold">
                    No Rooms Available
                  </p>
                  <p className="text-base md:text-lg text-[#d9cbb1] mt-2">
                    Try adjusting your dates or filters, or broaden your search.
                  </p>
                </div>
              )}
            {!isLoadingRooms &&
              !fetchError &&
              !initialSearchTriggered && ( // Prompt for initial search
                <div className="text-center py-10 bg-[#1a130e]/80 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col justify-center items-center min-h-[300px] border border-[#e5c882]/30">
                  <p className="text-xl md:text-2xl text-[#e5c882] font-semibold">
                    Find Your Perfect Stay
                  </p>
                  <p className="text-base md:text-lg text-[#d9cbb1] mt-2">
                    Please select your arrival, departure dates, and guest
                    numbers above to see available rooms.
                  </p>
                </div>
              )}
          </div>

          {/* Cart Sidebar */}
          <aside className="lg:w-[400px] xl:w-[440px] w-full bg-[#1a130e]/95 backdrop-blur-lg rounded-2xl border border-[#e5c882]/60 p-4 md:p-6 flex flex-col gap-5 sticky lg:top-8 max-h-[calc(100vh-4rem)] overflow-y-auto z-10 mb-6 lg:mb-0 shadow-2xl">
            <h2 className="text-xl md:text-2xl text-[#e5c882] font-semibold flex items-center gap-2 border-b border-[#e5c882]/20 pb-3">
              <Receipt className="w-5 md:w-6 h-5 md:h-6" />
              Votre Panier
              <span className="text-xs md:text-sm text-[#d9cbb1] ml-auto">
                ({cartItems.length} item{cartItems.length === 1 ? "" : "s"})
              </span>
            </h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                <img
                  src="/empty-cart-icon.png"
                  alt="Empty Cart"
                  width={80}
                  height={80}
                  className="opacity-50 mb-4"
                />{" "}
                {/* Add an icon */}
                <p className="text-base md:text-lg text-[#e5c882]">
                  Votre panier est vide.
                </p>
                <p className="text-sm text-[#d9cbb1] mt-1">
                  Ajoutez des chambres pour continuer.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1">
                {" "}
                {/* Ensure cart content can grow */}
                <div className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1">
                  {" "}
                  {/* Scrollable items */}
                  {cartItems.map((item, i) => (
                    <div
                      key={`${item.roomId}-${i}-${item.arrivalDate}`}
                      className="rounded-xl border border-[#e5c882]/40 bg-[#e5c882]/10 p-3.5 text-amber-200 font-medium space-y-1.5 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="rounded-md object-cover w-12 h-12"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-700 rounded-md flex items-center justify-center">
                              <Hotel size={24} className="text-slate-500" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm md:text-base font-semibold text-[#e5c882]">
                              {item.title}
                            </h4>
                            <div className="text-[10px] md:text-xs text-amber-200/80">
                              {item.nights} Nuit{item.nights === 1 ? "" : "s"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setCartItems((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                      <div className="text-xs text-amber-200/80 pl-14">
                        {new Date(item.arrivalDate).toLocaleDateString(
                          "fr-FR",
                          { day: "2-digit", month: "short" }
                        )}{" "}
                        -{" "}
                        {new Date(item.departureDate).toLocaleDateString(
                          "fr-FR",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                        <span className="mx-1">|</span>
                        {item.adults} Adulte(s)
                        {item.children > 0
                          ? `, ${item.children} Enfant(s)`
                          : ""}
                      </div>
                      <div className="flex justify-between items-end mt-1 pl-14">
                        <span className="text-[11px] md:text-xs text-[#d9cbb1]">
                          Sous-total
                        </span>
                        <span className="text-sm md:text-base font-semibold text-[#e5c882]">
                          {item.itemTotalPrice.toFixed(2).replace(".", ",")}{" "}
                          {item.currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Totals Section */}
                <div className="mt-auto space-y-3 pt-4 border-t border-[#e5c882]/20">
                  <div className="flex justify-between text-sm text-[#d9cbb1]">
                    <span>Taxes et frais estimatifs</span>
                    <span>
                      {calculateCartTotals.totalTax.replace(".", ",")}{" "}
                      {calculateCartTotals.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg md:text-xl font-bold text-[#e5c882]">
                    <span>Total à Payer</span>
                    <span>
                      {calculateCartTotals.grandTotal.replace(".", ",")}{" "}
                      {calculateCartTotals.currency}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-[#d9cbb1] text-center">
                    Le prix final sera confirmé à l'étape suivante.
                  </p>
                  <motion.button
                    onClick={handleProceedToPayment}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-black font-semibold shadow-lg shadow-amber-700/40 hover:from-amber-600 hover:to-orange-700 transition-all text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoadingRooms}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Vérifier ma réservation
                  </motion.button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      {/* Removed <style jsx> as it's empty and most animations are Tailwind or inline */}
    </div>
  );
}
