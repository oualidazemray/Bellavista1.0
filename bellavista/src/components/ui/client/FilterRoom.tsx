// src/components/ui/client/filterRoom.tsx
"use client";

import React, { useState } from "react";
// Removed: import { motion, AnimatePresence } from "framer-motion";
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
    <div
      className="relative cursor-pointer w-6 h-6" // Restored original size
      onClick={onChange}
    >
      <div
        className={`w-full h-full rounded-lg border-2 transition-all duration-300 ${
          // Restored original rounding & border
          checked
            ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 shadow-lg shadow-amber-400/30"
            : "border-gray-600 hover:border-amber-400 bg-[#1a130e]/90" // Restored original colors
        }`}
      >
        {checked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-black text-sm font-bold">✓</div>
          </div>
        )}
      </div>
    </div>
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
    <div className="group">
      <div
        className={`bg-gradient-to-br from-amber-950 to-gray-800 rounded-2xl border cursor-pointer overflow-hidden ${
          // Restored original rounding & bg
          isActive
            ? "border-amber-400 shadow-2xl shadow-amber-400/20"
            : "border-gray-700 hover:border-amber-300"
        }`}
        onClick={onClick}
      >
        <div className="p-6">
          {" "}
          {/* Restored original padding */}
          <div className="flex items-center gap-3 mb-4">
            {" "}
            {/* Restored original gap & margin */}
            <div
              className={`p-3 rounded-xl transition-all duration-300 ${
                // Restored original icon wrapper style
                isActive
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-400/30"
                  : "bg-gray-700 text-amber-400 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-black"
              }`}
            >
              {icon}
            </div>
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
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isActive
                ? "opacity-100 max-h-[1000px]"
                : "opacity-80 max-h-[200px]"
            }`} // Maintained accordion behavior with CSS
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  const FilterContent = () => (
    // Using min-h-fit for inline scenario, will be overridden by fixed inset for overlay
    <div
      className={`min-h-fit bg-[#1a130e]/90 backdrop-blur-sm relative overflow-hidden ${
        isOverlay ? "min-h-screen" : ""
      }`}
    >
      {/* Removed Animated background elements */}

      <div className="relative z-10 p-8 text-white">
        {" "}
        {/* Restored text-white for global text color here */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-2xl shadow-2xl shadow-amber-400/30">
              <FilterIcon className="w-8 h-8 text-black" />{" "}
              {/* Restored original size */}
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Smart Filters
              </h1>
              <p className="text-gray-400 text-lg">
                Find your perfect luxury stay
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-amber-400/30 rounded-2xl px-6 py-3 backdrop-blur-sm hover:border-amber-400 transition-colors duration-300">
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold">
                {
                  Object.values(filters)
                    .flat()
                    .filter((val) => {
                      if (Array.isArray(val)) return val.length > 0;
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
                      return false;
                    }).length
                }{" "}
                filters active
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-2xl p-3 backdrop-blur-sm hover:border-red-500 hover:bg-red-500/20 transition-all duration-300"
              >
                <X className="w-6 h-6" /> {/* Restored original size */}
              </button>
            )}
          </div>
        </div>
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
                  ].map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 cursor-pointer transition-all hover:translate-x-1"
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
                    </label>
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
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        filters.view.includes(item.value)
                          ? "bg-gradient-to-r from-amber-400/20 to-amber-600/20 border border-amber-400/50 shadow-lg"
                          : "bg-[#1a130e]/90 hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 border border-transparent hover:border-amber-400/30"
                      } hover:scale-102 active:scale-98`}
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
                    </label>
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
                  ].map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10 cursor-pointer transition-all hover:translate-x-1"
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
                    </label>
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
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                        filters.characteristics.includes(item.value)
                          ? "bg-gradient-to-r from-amber-400/20 to-amber-600/20 border border-amber-400/50 shadow-lg"
                          : "bg-[#1a130e]/90 hover:bg-gradient-to-r hover:from-amber-400/10 hover:to-amber-600/10"
                      } hover:scale-102 active:scale-98`}
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
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-semibold mb-3">
                  Max Price per Night
                </h4>
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-amber-400/20 hover:border-amber-400 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">Budget Range</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                      {filters.priceRange} MAD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="100"
                    value={filters.priceRange}
                    onChange={handlePriceRangeChange}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider hover:scale-102 transition-transform duration-150"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                        ((filters.priceRange - 500) / 9500) * 100
                      }%, #374151 ${
                        ((filters.priceRange - 500) / 9500) * 100
                      }%, #374151 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-3">
                    <span>500 MAD</span>
                    <span>10,000+ MAD</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
        {/* This "Apply Filters" button is for when HotelFilter is used as a full-page overlay */}
        {isOverlay && onClose && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={onClose}
              className="group relative px-12 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black rounded-2xl font-bold text-xl shadow-2xl shadow-amber-400/30 overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-amber-400/50"
            >
              {/* Removed inner motion.div for hover background sweep */}
              <span className="relative z-10 flex items-center gap-2">
                <FilterIcon className="w-5 h-5" />
                Apply Filters
              </span>
            </button>
          </div>
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
      <div className="fixed inset-0 z-[150] overflow-y-auto">
        <FilterContent />
      </div>
    );
  }
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      <FilterContent />
    </div>
  );
};
export default HotelFilter;
