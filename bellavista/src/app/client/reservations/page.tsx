// src/app/client/reservations/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Hotel,
  CalendarDays,
  Users,
  Receipt,
  BadgeEuro,
  CheckCircle,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import RoomCard from "@/components/ui/client/RoomCard";
import HotelFilter, { FilterState } from "@/components/ui/client/FilterRoom";
import BookingSection, {
  BookingParams,
} from "@/components/layout/bookingForLanding/BookingSection";

export interface RoomData {
  id: string;
  imageUrl?: string;
  imageUrls?: string[];
  name: string;
  description?: string;
  price: number;
  beds?: number;
  bedType: string;
  guests: number;
  view?: string;
  characteristics?: string[];
  sqMeters?: number;
  rating?: number;
  featured?: boolean;
  currency?: string;
  perNightText?: string;
  includesFeesText?: string;
}

const initialFilterState: FilterState = {
  sortBy: "recommended",
  display: "rooms",
  view: [],
  bedType: [],
  characteristics: [],
  maxPrice: "10000",
  priceRange: 10000,
};

export default function RoomsPage() {
  const [fetchedRooms, setFetchedRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [initialSearchTriggered, setInitialSearchTriggered] = useState(false);
  const [cartRooms, setCartRooms] = useState<any[]>([]);
  const [currentBookingParams, setCurrentBookingParams] =
    useState<BookingParams | null>(null);

  const handleReserve = (room: RoomData) => {
    /* ... (same as before) ... */
    const arrival = currentBookingParams?.arrivalDate;
    const departure = currentBookingParams?.departureDate;
    const arrivalDateStr =
      arrival?.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) || "N/A";
    const departureDateStr =
      departure?.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) || "N/A";
    const nights =
      arrival && departure
        ? Math.max(
            0,
            Math.ceil(
              (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 0;
    const cartItem = {
      title: room.name,
      desc: `Meilleur tarif\n${nights} Nuit${nights === 1 ? "" : "s"}`,
      price: `${room.price.toFixed(2).replace(".", ",")} MAD`,
      tax: "99.00 MAD",
      date: `${arrivalDateStr} - ${departureDateStr}`,
      guests: `${currentBookingParams?.adults || 0} Adulte(s)${
        currentBookingParams?.children || 0 > 0
          ? `, ${currentBookingParams?.children} Enfant(s)`
          : ""
      }`,
      roomId: room.id,
    };
    setCartRooms((prev) => [...prev, cartItem]);
  };
  const getTotal = () =>
    cartRooms
      .reduce(
        (acc, item) =>
          acc +
          parseFloat(item.price.replace(/[^\d.]/g, "")) +
          parseFloat(item.tax.replace(/[^\d.]/g, "")),
        0
      )
      .toFixed(2)
      .replace(".", ",") + " MAD";

  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersInPanel, setActiveFiltersInPanel] = useState<FilterState>(
    { ...initialFilterState }
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    ...initialFilterState,
  });

  const fetchRoomsFromAPI = useCallback(
    async (bookingParams: BookingParams | null, filters: FilterState) => {
      /* ... (same as before, ensure API path is /api/reservations/rooms) ... */
      if (
        !bookingParams ||
        !bookingParams.arrivalDate ||
        !bookingParams.departureDate
      ) {
        setFetchedRooms([]);
        setInitialSearchTriggered(false);
        if (isLoadingRooms) setIsLoadingRooms(false);
        return;
      }
      setIsLoadingRooms(true);
      setFetchError(null);
      setInitialSearchTriggered(true);
      const query = new URLSearchParams({
        arrivalDate: bookingParams.arrivalDate.toISOString(),
        departureDate: bookingParams.departureDate.toISOString(),
        adults: bookingParams.adults.toString(),
        children: bookingParams.children.toString(),
        priceRange: filters.priceRange.toString(),
        sortBy: filters.sortBy,
        ...(filters.view.length > 0 && { view: filters.view.join(",") }),
        ...(filters.bedType.length > 0 && {
          bedType: filters.bedType.join(","),
        }),
        ...(filters.characteristics.length > 0 && {
          characteristics: filters.characteristics.join(","),
        }),
      });
      const apiUrl = `/api/reservations/rooms?${query.toString()}`;
      console.log("[RoomsPage] Fetching:", apiUrl);
      try {
        const response = await fetch(apiUrl);
        const responseText = await response.text();
        if (!response.ok) {
          let errMsg = `API Error: ${response.status}`;
          try {
            const errData = JSON.parse(responseText);
            errMsg = errData.error || errData.message || errMsg;
            if (errData.details)
              errMsg += ` Details: ${JSON.stringify(errData.details)}`;
          } catch (e) {}
          throw new Error(errMsg);
        }
        const data: RoomData[] = JSON.parse(responseText);
        console.log("[RoomsPage] API Success. Rooms:", data.length);
        setFetchedRooms(data);
      } catch (error) {
        console.error("[RoomsPage] Fetch Error:", error);
        setFetchError(
          error instanceof Error ? error.message : "Unknown fetch error."
        );
        setFetchedRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [isLoadingRooms]
  ); // Added isLoadingRooms

  const handleBookingParamsSearch = useCallback(
    (params: BookingParams) => {
      setCurrentBookingParams(params);
      fetchRoomsFromAPI(params, appliedFilters);
    },
    [fetchRoomsFromAPI, appliedFilters]
  );
  const handleApplyFiltersClick = useCallback(() => {
    const newApplied = { ...activeFiltersInPanel };
    setAppliedFilters(newApplied);
    setShowFilters(false);
    if (currentBookingParams)
      fetchRoomsFromAPI(currentBookingParams, newApplied);
  }, [fetchRoomsFromAPI, currentBookingParams, activeFiltersInPanel]);
  const openFilterPanel = () => {
    setActiveFiltersInPanel({ ...appliedFilters });
    setShowFilters(true);
  };
  const handlePanelFiltersChange = (newFilters: FilterState) =>
    setActiveFiltersInPanel(newFilters);
  const handleCancelFiltersClick = () => {
    setActiveFiltersInPanel({ ...appliedFilters });
    setShowFilters(false);
  };

  const displayedRooms = useMemo(() => fetchedRooms, [fetchedRooms]);

  return (
    <div
      className="min-h-screen bg-cover bg-center font-cormorant relative"
      style={{
        backgroundImage: "url('/GalleryBack.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-20">
        <BookingSection
          onCheckAvailability={handleBookingParamsSearch}
          isLoading={isLoadingRooms}
        />
      </div>
      <div className="relative z-10 max-w-[1900px] mx-auto pt-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 px-4 md:px-8">
          {/* Restored FILTRE Button Style */}
          <button
            className="flex items-center gap-2 border-2 border-[#e5c882] rounded-md px-8 py-2 text-[#e5c882] text-2xl font-medium hover:bg-[#e5c882] hover:text-[#201a15] transition bg-transparent disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-center"
            onClick={openFilterPanel}
            disabled={!initialSearchTriggered || isLoadingRooms}
          >
            FILTRE
            <SlidersHorizontal size={24} />
          </button>
          <div className="flex flex-col items-center text-center md:text-left md:items-start">
            <span className="tracking-widest text-lg md:text-xl text-[#e5c882] font-light">
              EXPLORE OUR
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-[#e5c882] leading-none">
              SIGNATURE ROOMS
            </h1>
          </div>
        </div>

        {showFilters && initialSearchTriggered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 px-4 md:px-8"
          >
            <HotelFilter
              filters={activeFiltersInPanel}
              onFiltersChange={handlePanelFiltersChange}
              onClose={handleCancelFiltersClick}
              isOverlay={false}
            />
            {/* Restored Apply/Cancel Button Styles - you can adjust these further */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={handleApplyFiltersClick}
                disabled={isLoadingRooms}
                className="flex items-center justify-center gap-2 w-full sm:w-auto border-2 border-green-500 bg-green-700/80 hover:bg-green-600/80 rounded-md px-8 py-3 text-white text-xl font-medium transition disabled:opacity-50 shadow-lg hover:shadow-green-500/40"
              >
                <Check size={24} /> Appliquer Filtres
              </button>
              <button
                onClick={handleCancelFiltersClick}
                disabled={isLoadingRooms}
                className="flex items-center justify-center gap-2 w-full sm:w-auto border-2 border-red-500 bg-red-700/80 hover:bg-red-600/80 rounded-md px-8 py-3 text-white text-xl font-medium transition disabled:opacity-50 shadow-lg hover:shadow-red-500/40"
              >
                <XCircle size={24} /> Annuler
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col-reverse lg:flex-row gap-8 px-4 md:px-8">
          <div className="flex-1 min-h-[400px]">
            {isLoadingRooms && (
              <div className="flex flex-col justify-center items-center h-full text-center py-10">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                <p className="text-lg text-amber-300">Searching rooms...</p>
              </div>
            )}
            {!isLoadingRooms && fetchError && (
              <div className="text-center py-10 bg-red-900/40 border border-red-700 rounded-xl p-6">
                <p className="text-lg text-red-300 font-semibold">
                  Failed to Load Rooms
                </p>
                <p className="text-md text-red-400 mt-2">{fetchError}</p>
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
                      {...room}
                      onReserve={() => handleReserve(room)}
                      onDetails={() =>
                        alert(
                          `Details for: ${room.name}\n${
                            room.description || "No description."
                          }`
                        )
                      }
                      className="w-full"
                    />
                  ))}
                </div>
              )}
            {!isLoadingRooms &&
              !fetchError &&
              initialSearchTriggered &&
              displayedRooms.length === 0 && (
                <div className="text-center py-10 bg-[#1a130e]/80 rounded-xl p-6 h-full flex flex-col justify-center items-center min-h-[300px]">
                  <p className="text-xl md:text-2xl text-[#e5c882] font-semibold">
                    No Rooms Available
                  </p>
                  <p className="text-base md:text-lg text-[#d9cbb1] mt-2">
                    Try adjusting dates or filters.
                  </p>
                </div>
              )}
            {!isLoadingRooms && !fetchError && !initialSearchTriggered && (
              <div className="text-center py-10 bg-[#1a130e]/80 rounded-xl p-6 h-full flex flex-col justify-center items-center min-h-[300px]">
                <p className="text-xl md:text-2xl text-[#e5c882] font-semibold">
                  Find Your Perfect Stay
                </p>
                <p className="text-base md:text-lg text-[#d9cbb1] mt-2">
                  Select dates and guests above.
                </p>
              </div>
            )}
          </div>
          {/* Cart Sidebar - Assuming its styles were okay */}
          <aside className="lg:w-[400px] xl:w-[440px] w-full bg-[#1a130e]/90 rounded-2xl border border-[#e5c882]/70 p-4 md:p-6 flex flex-col gap-5 sticky lg:top-8 max-h-[calc(100vh-4rem)] overflow-y-auto z-10 mb-6 lg:mb-0 shadow-2xl">
            <h2 className="text-xl md:text-2xl text-[#e5c882] font-semibold flex items-center gap-2">
              <Receipt className="w-5 md:w-6 h-5 md:h-6" />
              Votre Panier{" "}
              <span className="text-xs md:text-sm text-[#d9cbb1]">
                ({cartRooms.length} article{cartRooms.length === 1 ? "" : "s"})
              </span>
            </h2>
            {cartRooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base md:text-lg text-[#e5c882]">
                  Votre panier est vide.
                </p>
                <p className="text-sm text-[#d9cbb1] mt-1">
                  Ajoutez des chambres.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <h3 className="text-base md:text-lg text-[#e5c882] font-medium flex items-center gap-2 border-b border-[#e5c882]/30 pb-1.5">
                  <BadgeEuro className="w-4 md:w-5 h-4 md:h-5" />
                  Détails des prix
                </h3>
                {cartRooms.map((item, i) => (
                  <div
                    key={`${item.roomId}-${i}`}
                    className="rounded-xl border border-[#e5c882]/40 bg-[#e5c882]/5 p-3 text-amber-300 font-medium space-y-1.5"
                  >
                    {" "}
                    <div className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <Hotel className="w-4 md:w-5 h-4 md:h-5" />
                      {item.title}
                    </div>
                    <div className="text-xs text-amber-200/80 whitespace-pre-line leading-relaxed">
                      {item.desc}
                    </div>
                    <div className="flex justify-between mt-1 text-sm md:text-base font-medium">
                      <span>Prix</span>
                      <span>{item.price}</span>
                    </div>
                    <div className="mt-1 font-semibold text-xs md:text-sm">
                      Taxes et frais
                    </div>
                    <div className="flex justify-between text-[11px] md:text-xs text-[#d9cbb1]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {item.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {item.guests}
                        </div>
                      </div>
                      <span className="text-[#e5c882]">{item.tax}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-3 md:p-4 rounded-xl border border-[#e5c882]/40 bg-[#e5c882]/10">
                  <div className="flex justify-between text-lg md:text-xl font-bold text-[#e5c882]">
                    <span>Total</span>
                    <span>{getTotal()}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-[#d9cbb1] mt-0.5">
                    Inclut les taxes et frais.
                  </p>
                </div>
                <motion.button
                  className="flex items-center justify-center px-6 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg text-black font-semibold shadow-lg shadow-amber-800/30 hover:from-amber-600 hover:to-amber-700 transition-colors text-sm md:text-base"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Vérifier ma réservation
                </motion.button>
              </div>
            )}
          </aside>
        </div>
      </div>
      {/* Removed the <style jsx> block as most styles were Tailwind or component-specific */}
    </div>
  );
}
