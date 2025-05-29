// src/components/ui/agent/AgentRoomFilter.tsx
"use client";

import React from "react";
import {
  SlidersHorizontal,
  DollarSign,
  Users,
  Eye,
  Bed,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RoomType as PrismaRoomType,
  RoomView as PrismaRoomView,
} from "@prisma/client";

// Define the state for agent-specific filters
export interface AgentFilterState {
  maxPrice?: string; // Stored as string from input, convert to number on API call
  minGuests?: number;
  roomType?: PrismaRoomType | ""; // Empty string for "Any"
  view?: PrismaRoomView | ""; // Empty string for "Any"
  sortBy?: "price_asc" | "price_desc" | "rating_desc" | "recommended"; // Add more as needed
  characteristics?: string[]; // For amenities
}

export const initialAgentFilterStateValues: AgentFilterState = {
  maxPrice: "",
  minGuests: undefined,
  roomType: "",
  view: "",
  sortBy: "recommended",
  characteristics: [],
};

interface AgentRoomFilterProps {
  filters: AgentFilterState;
  onFiltersChange: (newFilters: AgentFilterState) => void; // Update filters as they change
  onApplyFilters: () => void; // Trigger search with current filters
  onResetFilters: () => void; // Reset to initial/default filters
}

const AgentRoomFilter: React.FC<AgentRoomFilterProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;
    if (type === "number") {
      processedValue = value === "" ? undefined : parseInt(value, 10);
    }
    if ((name === "roomType" || name === "view") && value === "_ANY_") {
      processedValue = "";
    }
    onFiltersChange({ ...filters, [name]: processedValue });
  };

  const handleSelectChange = (
    name: "roomType" | "view" | "sortBy",
    value: string
  ) => {
    const processedValue = value === "_ANY_" ? "" : value;
    onFiltersChange({ ...filters, [name]: processedValue as any });
  };

  // Example characteristics (can come from DB or config)
  const availableCharacteristics = [
    "wifi",
    "ac",
    "balcony",
    "tv",
    "minibar",
    "pet-friendly",
  ];

  const handleCharacteristicToggle = (char: string) => {
    const currentChars = filters.characteristics || [];
    const newChars = currentChars.includes(char)
      ? currentChars.filter((c) => c !== char)
      : [...currentChars, char];
    onFiltersChange({ ...filters, characteristics: newChars });
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
          <SlidersHorizontal size={18} /> Filter Options
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label
            htmlFor="maxPriceAgentFilter"
            className="text-xs text-slate-400"
          >
            Max Price/Night
          </Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="number"
              id="maxPriceAgentFilter"
              name="maxPrice"
              value={filters.maxPrice || ""}
              onChange={handleInputChange}
              placeholder="e.g., 500"
              className="pl-8 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </div>
        <div>
          <Label
            htmlFor="minGuestsAgentFilter"
            className="text-xs text-slate-400"
          >
            Min. Guests
          </Label>
          <Input
            type="number"
            id="minGuestsAgentFilter"
            name="minGuests"
            value={filters.minGuests || ""}
            onChange={handleInputChange}
            min="1"
            placeholder="e.g., 2"
            className="mt-1 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <div>
          <Label
            htmlFor="roomTypeAgentFilter"
            className="text-xs text-slate-400"
          >
            Room Type
          </Label>
          <Select
            name="roomType"
            value={filters.roomType || "_ANY_"}
            onValueChange={(val) => handleSelectChange("roomType", val)}
          >
            <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Any Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="_ANY_" className="focus:bg-slate-700">
                Any Type
              </SelectItem>
              {Object.values(PrismaRoomType).map((rt) => (
                <SelectItem key={rt} value={rt} className="focus:bg-slate-700">
                  {rt.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="viewAgentFilter" className="text-xs text-slate-400">
            Room View
          </Label>
          <Select
            name="view"
            value={filters.view || "_ANY_"}
            onValueChange={(val) => handleSelectChange("view", val)}
          >
            <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Any View" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="_ANY_" className="focus:bg-slate-700">
                Any View
              </SelectItem>
              {Object.values(PrismaRoomView).map((rv) => (
                <SelectItem key={rv} value={rv} className="focus:bg-slate-700">
                  {rv.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sortByAgentFilter" className="text-xs text-slate-400">
            Sort By
          </Label>
          <Select
            name="sortBy"
            value={filters.sortBy || "recommended"}
            onValueChange={(val) => handleSelectChange("sortBy", val)}
          >
            <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="recommended" className="focus:bg-slate-700">
                Recommended
              </SelectItem>
              <SelectItem value="price_asc" className="focus:bg-slate-700">
                Price: Low to High
              </SelectItem>
              <SelectItem value="price_desc" className="focus:bg-slate-700">
                Price: High to Low
              </SelectItem>
              <SelectItem value="rating_desc" className="focus:bg-slate-700">
                Rating: High to Low
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="block text-xs text-slate-400 mb-2">
          Characteristics
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {availableCharacteristics.map((char) => (
            <Button
              key={char}
              variant={
                filters.characteristics?.includes(char) ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleCharacteristicToggle(char)}
              className={`text-xs ${
                filters.characteristics?.includes(char)
                  ? "bg-cyan-600 border-cyan-600 hover:bg-cyan-700"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {char.charAt(0).toUpperCase() + char.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
        <Button
          variant="ghost"
          onClick={onResetFilters}
          className="text-slate-400 hover:text-white"
        >
          <RotateCcw size={16} className="mr-2" /> Reset
        </Button>
        <Button
          onClick={onApplyFilters}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default AgentRoomFilter;
