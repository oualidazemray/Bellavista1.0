// src/components/ui/client/filterRoom.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Filter as FilterIcon,
  Star,
  Bed,
  Eye,
  DollarSign,
  Wifi,
  Building2,
  Trees,
  Home,
  Waves,
  Crown,
  Users,
  Bath,
  Sunset,
  Snowflake,
  Tv,
} from "lucide-react";

export interface FilterState {
  sortBy: string;
  display: string;
  view: string[];
  bedType: string[];
  characteristics: string[];
  maxPrice: string;
  priceRange: number;
}

interface HotelFilterProps {
  onClose?: () => void;
  isOverlay?: boolean;
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
}

const initialLocalFilterState: FilterState = {
  // For calculating active filters count
  sortBy: "recommended",
  display: "rooms",
  view: [],
  bedType: [],
  characteristics: [],
  maxPrice: "10000",
  priceRange: 10000,
};

const HotelFilter: React.FC<HotelFilterProps> = ({
  onClose,
  isOverlay = false,
  filters,
  onFiltersChange,
}) => {
  const [activeSection, setActiveSection] = useState<string>("sort");

  const handleCheckboxChange = (category: keyof FilterState, value: string) => {
    let newFiltersState: FilterState;
    if (category === "sortBy" || category === "display") {
      newFiltersState = { ...filters, [category]: value };
    } else {
      const arrayCategory = category as keyof Pick<
        FilterState,
        "view" | "bedType" | "characteristics"
      >;
      const currentArray = filters[arrayCategory] as string[];
      newFiltersState = {
        ...filters,
        [arrayCategory]: currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    }
    onFiltersChange(newFiltersState);
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueNum = parseInt(e.target.value, 10);
    onFiltersChange({
      ...filters,
      priceRange: valueNum,
      maxPrice: e.target.value,
    });
  };

  const ModernCheckbox = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <motion.div
      className="relative cursor-pointer w-6 h-6" // Restored original size
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onChange}
    >
      <motion.div
        className={`w-full h-full rounded-lg border-2 transition-all duration-300 ${
          // Restored original rounding & border
          checked
            ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 shadow-lg shadow-amber-400/30"
            : "border-gray-600 hover:border-amber-400 bg-[#1a130e]/90" // Restored original colors
        }`}
        initial={false}
        animate={{
          backgroundColor: checked ? "#f59e0b" : "rgba(31, 41, 55, 0.5)", // Kept this animate for check
          borderColor: checked ? "#f59e0b" : "#6b7280",
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-black text-sm font-bold">✓</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  const SectionCard = ({
    title,
    icon,
    isActive,
    onClick,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: isActive ? 1 : 1.02 }} // Restored original hover scale
      className="group"
    >
      <motion.div
        className={`bg-gradient-to-br from-amber-950 to-gray-800 rounded-2xl border cursor-pointer overflow-hidden ${
          // Restored original rounding & bg
          isActive
            ? "border-amber-400 shadow-2xl shadow-amber-400/20"
            : "border-gray-700 hover:border-amber-300"
        }`}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-6">
          {" "}
          {/* Restored original padding */}
          <motion.div
            className="flex items-center gap-3 mb-4" // Restored original gap & margin
            initial={false}
            animate={{ scale: isActive ? 1.05 : 1 }} // Restored original scale animate
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className={`p-3 rounded-xl transition-all duration-300 ${
                // Restored original icon wrapper style
                isActive
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-400/30"
                  : "bg-gray-700 text-amber-400 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-black"
              }`}
              whileHover={{ rotate: 5 }}
              whileTap={{ rotate: -5 }}
            >
              {icon}
            </motion.div>
            <h3
              className={`text-xl font-bold transition-colors ${
                // Restored original text size
                isActive
                  ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {title}
            </h3>
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0.8,
              maxHeight: isActive ? 1000 : 200, // Restored original max height
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );

  const FilterContent = () => (
    // Using min-h-fit for inline scenario, will be overridden by fixed inset for overlay
    <div
      className={`min-h-fit bg-[#1a130e]/90 backdrop-blur-sm relative overflow-hidden ${
        isOverlay ? "min-h-screen" : ""
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-48 h-48 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-amber-400/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 p-8 text-white">
        {" "}
        {/* Restored text-white for global text color here */}
        <motion.div
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-2xl shadow-2xl shadow-amber-400/30"
              whileHover={{ rotate: 10, scale: 1.1 }}
              whileTap={{ rotate: -10, scale: 0.9 }}
            >
              <FilterIcon className="w-8 h-8 text-black" />{" "}
              {/* Restored original size */}
            </motion.div>
            <div>
              <motion.h1
                className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Smart Filters
              </motion.h1>
              <motion.p
                className="text-gray-400 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Find your perfect luxury stay
              </motion.p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-amber-400/30 rounded-2xl px-6 py-3 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: "#f59e0b" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold">
                {/* Simplified active filter count for now, can be refined */}
                {
                  Object.values(filters)
                    .flat()
                    .filter((val) => {
                      if (Array.isArray(val)) return val.length > 0;
                      // For non-array, check if it's different from a sensible default or simply if it's a truthy non-default string
                      if (
                        typeof val === "string" &&
                        (val === filters.sortBy || val === filters.display)
                      )
                        return (
                          val !==
                          initialLocalFilterState[
                            Object.keys(initialLocalFilterState).find(
                              (k) =>
                                k ===
                                (val === filters.sortBy ? "sortBy" : "display")
                            ) as keyof FilterState
                          ]
                        );
                      if (typeof val === "number" && val === filters.priceRange)
                        return val !== initialLocalFilterState.priceRange;
                      return false; // Fallback, adjust as needed for maxPrice, etc.
                    }).length
                }{" "}
                filters active
              </span>
            </motion.div>
            {onClose && ( // If onClose is provided, always show the X button
              <motion.button
                onClick={onClose}
                className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-2xl p-3 backdrop-blur-sm hover:border-red-500 transition-all duration-300"
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.8 }}
              >
                <X className="w-6 h-6" /> {/* Restored original size */}
              </motion.button>
            )}
          </div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {" "}
          {/* Restored original gap */}
          {/* Sort Section */}
          <SectionCard
            title="Sort & Display"
            icon={<Star className="w-5 h-5" />}
            isActive={activeSection === "sort"}
            onClick={() => setActiveSection("sort")}
          >
            <div className="space-y-6">
              {" "}
              {/* Restored original spacing */}
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Sort by
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      value: "recommended",
                      label: "Recommended",
                      desc: "Best overall value",
                      icon: <Star className="w-4 h-4" />,
                    },
                    {
                      value: "lowest",
                      label: "Lowest Price",
                      desc: "Budget friendly",
                      icon: <DollarSign className="w-4 h-4" />,
                    },
                    {
                      value: "highest",
                      label: "Luxury First",
                      desc: "Premium options",
                      icon: <Crown className="w-4 h-4" />,
                    },
                  ].map((item, index) => (
                    <motion.label
                      key={item.value}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 cursor-pointer transition-all"
                      whileHover={{ x: 5 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ModernCheckbox
                        checked={filters.sortBy === item.value}
                        onChange={() =>
                          handleCheckboxChange("sortBy", item.value)
                        }
                      />
                      <div className="flex items-center gap-2 text-amber-400">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {item.label}
                        </span>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>
              {/* Display options can be added here, similar structure to Sort By */}
            </div>
          </SectionCard>
          {/* Views & Beds Section */}
          <SectionCard
            title="Views & Bed Types"
            icon={<Eye className="w-5 h-5" />}
            isActive={activeSection === "views"}
            onClick={() => setActiveSection("views")}
          >
            <div className="space-y-6">
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Room Views
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "CITY",
                      label: "City View",
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      value: "PARK",
                      label: "Park View",
                      icon: <Trees className="w-4 h-4" />,
                    },
                    {
                      value: "POOL",
                      label: "Pool View",
                      icon: <Waves className="w-4 h-4" />,
                    },
                    {
                      value: "GARDEN",
                      label: "Garden View",
                      icon: <Trees className="w-4 h-4" />,
                    },
                    {
                      value: "COURTYARD",
                      label: "Courtyard",
                      icon: <Home className="w-4 h-4" />,
                    },
                  ].map((item, index) => (
                    <motion.label
                      key={item.value}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        filters.view.includes(item.value)
                          ? "bg-gradient-to-r from-amber-400/20 to-amber-600/20 border border-amber-400/50 shadow-lg"
                          : "bg-[#1a130e]/90 hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 border border-transparent hover:border-amber-400/30"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ModernCheckbox
                        checked={filters.view.includes(item.value)}
                        onChange={() =>
                          handleCheckboxChange("view", item.value)
                        }
                      />
                      <div className="text-amber-400">{item.icon}</div>
                      <span className="text-sm font-medium text-white">
                        {item.label}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Bed Types
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      value: "various",
                      label: "Various Types",
                      icon: <Bed className="w-4 h-4" />,
                    },
                    {
                      value: "king",
                      label: "King Size",
                      icon: <Crown className="w-4 h-4" />,
                    },
                    {
                      value: "queen",
                      label: "Queen Size",
                      icon: <Bed className="w-4 h-4" />,
                    },
                    {
                      value: "twin",
                      label: "Twin/Single Beds",
                      icon: <Users className="w-4 h-4" />,
                    },
                  ].map((item, index) => (
                    <motion.label
                      key={item.value}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 cursor-pointer transition-all"
                      whileHover={{ x: 5 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <ModernCheckbox
                        checked={filters.bedType.includes(item.value)}
                        onChange={() =>
                          handleCheckboxChange("bedType", item.value)
                        }
                      />
                      <div className="text-amber-400">{item.icon}</div>
                      <span className="text-white font-medium">
                        {item.label}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
          {/* Amenities & Price Section */}
          <SectionCard
            title="Amenities & Price"
            icon={<Settings className="w-5 h-5" />}
            isActive={activeSection === "amenities"}
            onClick={() => setActiveSection("amenities")}
          >
            <div className="space-y-6">
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Amenities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {" "}
                  {/* Changed to grid for better layout if many amenities */}
                  {[
                    {
                      value: "internet",
                      label: "Wi-Fi",
                      icon: <Wifi className="w-4 h-4" />,
                    },
                    {
                      value: "ac",
                      label: "Air Conditioning",
                      icon: <Snowflake className="w-4 h-4" />,
                    },
                    {
                      value: "bathtub",
                      label: "Bathtub",
                      icon: <Bath className="w-4 h-4" />,
                    },
                    {
                      value: "balcony",
                      label: "Balcony/Terrace",
                      icon: <Sunset className="w-4 h-4" />,
                    },
                    {
                      value: "bidet",
                      label: "Bidet",
                      icon: <Bath className="w-4 h-4" />,
                    },
                    {
                      value: "tv",
                      label: "Television",
                      icon: <Tv className="w-4 h-4" />,
                    },
                  ].map((item, index) => (
                    <motion.label
                      key={item.value}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        filters.characteristics.includes(item.value)
                          ? "bg-gradient-to-r from-amber-400/20 to-amber-600/20 border border-amber-400/50 shadow-lg"
                          : "bg-[#1a130e]/90 hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ModernCheckbox
                        checked={filters.characteristics.includes(item.value)}
                        onChange={() =>
                          handleCheckboxChange("characteristics", item.value)
                        }
                      />
                      <div className="text-amber-400">{item.icon}</div>
                      <span className="font-medium text-white text-sm">
                        {item.label}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Max Price per Night
                </h4>
                <motion.div
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-amber-400/20"
                  whileHover={{ borderColor: "#f59e0b" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">Budget Range</span>
                    <motion.span
                      className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
                      key={filters.priceRange}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {filters.priceRange} MAD
                    </motion.span>
                  </div>
                  <motion.input
                    type="range"
                    min="500"
                    max="10000"
                    step="100"
                    value={filters.priceRange}
                    onChange={handlePriceRangeChange}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                        ((filters.priceRange - 500) / 9500) * 100
                      }%, #374151 ${
                        ((filters.priceRange - 500) / 9500) * 100
                      }%, #374151 100%)`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-3">
                    <span>500 MAD</span>
                    <span>10,000+ MAD</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </SectionCard>
        </div>
        {/* This "Apply Filters" button is for when HotelFilter is used as a full-page overlay */}
        {isOverlay && onClose && (
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              onClick={onClose}
              className="group relative px-12 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black rounded-2xl font-bold text-xl shadow-2xl shadow-amber-400/30 overflow-hidden"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(245, 158, 11, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-700"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <FilterIcon className="w-5 h-5" />
                Apply Filters
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          border: 2px solid #fbbf24; /* margin-top: -10px; */ /* Adjusted for h-3 track */
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          cursor: pointer;
          border: 2px solid #fbbf24;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </div>
  );

  if (isOverlay) {
    return (
      <motion.div
        className="fixed inset-0 z-[150] overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FilterContent />
      </motion.div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      <FilterContent />
    </div>
  );
};
export default HotelFilter;
