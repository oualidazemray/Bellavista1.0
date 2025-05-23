// src/components/ui/client/RoomCard.tsx
"use client"; // Keep if you use hooks like useState, otherwise can be removed if purely display

import React, { useState } from "react"; // useState for isHovered
import { motion } from "framer-motion";
import {
  BedDouble,
  User2,
  PlusCircle,
  Wifi,
  Coffee,
  Bath,
  ChevronRight,
  Star,
  ImageOff, // For missing image placeholder
  Settings, // Default characteristic icon
  Snowflake, // For AC
  Tv, // For Television
  Sunset, // For Balcony/Terrace
} from "lucide-react";

// This interface should align with the RoomData interface in RoomsPage.tsx
// which in turn aligns with what the API returns.
export interface RoomCardProps {
  id: string;
  imageUrl?: string;
  imageUrls?: string[]; // For potential gallery, not used in this card version directly
  name: string;
  description?: string;
  price: number; // API returns number
  beds?: number;
  bedType: string; // This is the descriptive string like "1 King Bed", "DOUBLE_CONFORT"
  guests: number;
  view?: string; // Not directly displayed on card in this version, but available
  characteristics?: string[];
  sqMeters?: number;
  rating?: number;
  featured?: boolean;
  currency?: string;
  perNightText?: string;
  includesFeesText?: string;
  onReserve?: () => void;
  onDetails?: () => void;
  className?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({
  imageUrl,
  name,
  price,
  currency = "MAD",
  perNightText = "Par nuit",
  includesFeesText = "Y compris tous les frais",
  beds, // This might be less relevant if bedType is descriptive enough
  bedType, // This now comes as a descriptive string from the API
  guests,
  sqMeters,
  rating = 0, // Default to 0 if not provided, so Math.round works
  featured = false,
  characteristics = [], // Renamed from amenities, default to empty array
  onReserve,
  onDetails,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Display only a certain number of characteristics max in the card
  const displayedCharacteristics = characteristics.slice(0, 3);
  const hasMoreCharacteristics = characteristics.length > 3;

  // Get icon for a characteristic
  const getCharacteristicIcon = (characteristic: string) => {
    const lowerChar = characteristic.toLowerCase();
    if (lowerChar.includes("wifi") || lowerChar.includes("internet"))
      return <Wifi size={16} className="text-amber-300" />;
    if (
      lowerChar.includes("petit-déjeuner") ||
      lowerChar.includes("cafe") ||
      lowerChar.includes("coffee")
    )
      return <Coffee size={16} className="text-amber-300" />;
    if (
      lowerChar.includes("bain") ||
      lowerChar.includes("douche") ||
      lowerChar.includes("bathtub")
    )
      return <Bath size={16} className="text-amber-300" />;
    if (
      lowerChar.includes("ac") ||
      lowerChar.includes("air conditioning") ||
      lowerChar.includes("climatisation")
    )
      return <Snowflake size={16} className="text-amber-300" />;
    if (lowerChar.includes("tv") || lowerChar.includes("television"))
      return <Tv size={16} className="text-amber-300" />;
    if (
      lowerChar.includes("balcony") ||
      lowerChar.includes("terrace") ||
      lowerChar.includes("terrasse")
    )
      return <Sunset size={16} className="text-amber-300" />;
    // Add more mappings for your specific characteristics (e.g., "bidet", "minibar")
    return <Settings size={16} className="text-amber-300" />; // A default icon
  };

  return (
    <motion.div
      className={`rounded-xl overflow-hidden ${className} flex flex-col`} // Corrected template literal, added flex flex-col
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        background: "linear-gradient(145deg, #25201b 0%, #151210 100%)",
        boxShadow: "0 10px 20px rgba(0,0,0,0.2), 0 6px 6px rgba(0,0,0,0.15)", // Added a subtle shadow
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{
        y: -5,
        boxShadow: "0 15px 30px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.2)",
      }} // Enhanced hover shadow
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image Container with Overlay */}
      <div className="relative w-full h-72 overflow-hidden bg-gray-800">
        {" "}
        {/* Added bg for missing image state */}
        {featured && (
          <div className="absolute top-4 left-0 z-20 bg-amber-600 text-white py-1 px-4 rounded-r-full font-sans text-sm shadow-md">
            <span className="flex items-center">
              <Star size={14} className="mr-1 fill-white" /> RECOMMANDÉ
            </span>
          </div>
        )}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: isHovered ? 0.65 : 0.4 }} // Slightly increased opacity on hover
          transition={{ duration: 0.3 }}
        />
        {imageUrl ? (
          <motion.img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full"
            initial={{ scale: 1 }} // Start at normal scale
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }} // Smoother transition
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-amber-400/50">
            <ImageOff size={56} />
            <p className="mt-2 text-sm">Image non disponible</p>
          </div>
        )}
        {/* Room name overlay on image */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-6">
          {" "}
          {/* Increased z-index */}
          <motion.h2
            className="text-3xl md:text-4xl font-medium text-white [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]" // Added text shadow for readability
            // The y-animation on hover for name can be distracting, consider removing or making subtle
            // animate={{ y: isHovered ? -5 : 0, opacity: isHovered ? 0 : 1 }}
            // transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h2>
          {/* Rating */}
          {rating &&
            rating > 0 && ( // Only show if rating is positive
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[...Array(5)].map(
                    (
                      _,
                      idx // Use index for key
                    ) => (
                      <Star
                        key={idx}
                        size={14}
                        className={`${
                          idx < Math.round(rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-600"
                        } mr-0.5`} // Use gray-600 for unfilled
                      />
                    )
                  )}
                </div>
                <span className="text-white text-sm ml-2 font-medium">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Content - Added flex-grow to make this section fill remaining space */}
      <div className="p-6 border-t border-amber-900/30 flex flex-col flex-grow">
        <div className="flex flex-col gap-4">
          {" "}
          {/* Main content gap */}
          {/* Room details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-black/20 border border-amber-900/20 text-center">
              <BedDouble size={22} className="text-amber-300 mb-1" />
              <span className="text-amber-200 text-sm leading-tight capitalize">
                {bedType}{" "}
                {/* This now comes from API, e.g., "1 King Bed" or "DOUBLE_CONFORT" */}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-black/20 border border-amber-900/20 text-center">
              <User2 size={22} className="text-amber-300 mb-1" />
              <span className="text-amber-200 text-sm leading-tight">
                {guests} invité(s)
              </span>
            </div>

            {sqMeters && sqMeters > 0 ? (
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-black/20 border border-amber-900/20 text-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  className="text-amber-300 mb-1"
                >
                  <path
                    fill="currentColor"
                    d="M10 14L4 14L4 4L14 4L14 10L20 10L20 20L10 20L10 14M10 10L14 10L14 4L4 4L4 14L10 14L10 10M16 16V12H12V16H16Z"
                  />
                </svg>
                <span className="text-amber-200 text-sm leading-tight">
                  {sqMeters} m²
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-black/20 border border-amber-900/20 text-center opacity-70">
                <PlusCircle size={22} className="text-amber-300 mb-1" />
                <span className="text-amber-200 text-sm leading-tight">
                  Plus d'infos
                </span>
              </div>
            )}
          </div>
          {/* Characteristics (formerly Amenities) */}
          {characteristics.length > 0 && (
            <div className="mt-2">
              <h3 className="text-amber-200 text-sm mb-2 font-sans uppercase tracking-wider">
                Inclus
              </h3>
              <ul className="flex flex-wrap gap-2">
                {displayedCharacteristics.map((char, index) => (
                  <li
                    key={index}
                    className="flex items-center bg-black/20 rounded-full px-3 py-1 border border-amber-900/20"
                  >
                    {getCharacteristicIcon(char)}
                    <span className="text-amber-100 text-xs ml-1.5 font-sans capitalize">
                      {char.replace(/_/g, " ")}
                    </span>{" "}
                    {/* Replace underscores for display */}
                  </li>
                ))}
                {hasMoreCharacteristics && (
                  <li className="flex items-center bg-black/20 rounded-full px-3 py-1 border border-amber-900/20">
                    <PlusCircle size={16} className="text-amber-300" />
                    <span className="text-amber-100 text-xs ml-1.5 font-sans">
                      Et plus
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>{" "}
        {/* End of main content gap div */}
        {/* Price and Actions - Pushed to the bottom using mt-auto on this div */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mt-auto pt-4 border-t border-amber-900/30">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <div className="flex items-end gap-1 justify-center md:justify-start">
              <span className="text-3xl md:text-4xl text-amber-300 font-bold">
                {price ? price.toFixed(0) : "N/A"}{" "}
                {/* Display price, ensure it's a number */}
              </span>
              <span className="text-xl text-amber-300">{currency}</span>
            </div>
            <div className="text-sm text-amber-200/80">{perNightText}</div>
            <div className="text-xs text-amber-200/60 font-sans">
              {includesFeesText}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <motion.button
              onClick={onDetails}
              className="flex-1 md:flex-initial flex items-center justify-center px-4 py-2.5 bg-transparent border border-amber-400/40 rounded-lg text-amber-300 text-sm font-medium hover:bg-amber-900/30 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Détails
              <ChevronRight size={16} className="ml-1" />
            </motion.button>

            <motion.button
              onClick={onReserve}
              className="flex-1 md:flex-initial flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-lg text-black font-semibold shadow-lg shadow-amber-800/30 hover:shadow-amber-500/40 transition-all hover:brightness-110"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              RÉSERVER
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
