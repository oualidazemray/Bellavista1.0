// src/components/ui/agent/AgentBookingParamsSection.tsx
"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Users,
  Search as SearchIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // shadcn Calendar
import { DateRange } from "react-day-picker";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import toast from "react-hot-toast";

export interface AgentBookingParams {
  arrivalDate: Date;
  departureDate: Date;
  adults: number;
  children: number;
  nights: number;
}

interface AgentBookingParamsSectionProps {
  onSearchRooms: (params: AgentBookingParams) => void; // Renamed for clarity
  isLoading?: boolean;
  initialParams?: Partial<
    Pick<
      AgentBookingParams,
      "arrivalDate" | "departureDate" | "adults" | "children"
    >
  >;
}

const AgentBookingParamsSection: React.FC<AgentBookingParamsSectionProps> = ({
  onSearchRooms,
  isLoading = false,
  initialParams,
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    return {
      from: initialParams?.arrivalDate || today,
      to: initialParams?.departureDate || addDays(today, 3),
    };
  });
  const [adults, setAdults] = useState(initialParams?.adults || 1);
  const [children, setChildren] = useState(initialParams?.children || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select both arrival and departure dates.");
      return;
    }
    if (dateRange.from >= dateRange.to) {
      toast.error("Departure date must be after arrival date.");
      return;
    }
    if (adults < 1) {
      toast.error("At least one adult is required.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange.from < today) {
      toast.error("Arrival date cannot be in the past.");
      return;
    }

    const nights = differenceInCalendarDays(dateRange.to, dateRange.from);
    if (nights <= 0) {
      toast.error("Stay must be for at least one night.");
      return;
    }

    onSearchRooms({
      arrivalDate: dateRange.from,
      departureDate: dateRange.to,
      adults,
      children,
      nights,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-6 bg-slate-800/70 backdrop-blur-sm rounded-lg border border-slate-700/50 space-y-4 shadow-md"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
          <Label
            htmlFor="dateRangeAgent"
            className="text-xs font-medium text-slate-300"
          >
            Stay Dates
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateRangeAgent"
                variant={"outline"}
                className={`w-full justify-start text-left font-normal mt-1 h-11
                  ${!dateRange?.from ? "text-muted-foreground" : "text-white"}
                  bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:text-white focus-visible:ring-offset-0 focus-visible:ring-cyan-500`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-slate-800 border-slate-700"
              align="start"
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) =>
                  date < new Date(new Date().setDate(new Date().getDate() - 1))
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label
            htmlFor="adultsAgent"
            className="text-xs font-medium text-slate-300"
          >
            Adults
          </Label>
          <Input
            id="adultsAgent"
            type="number"
            min="1"
            value={adults}
            onChange={(e) =>
              setAdults(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="mt-1 h-11 bg-slate-700/50 border-slate-600 text-white focus-visible:ring-offset-0 focus-visible:ring-cyan-500"
          />
        </div>
        <div>
          <Label
            htmlFor="childrenAgent"
            className="text-xs font-medium text-slate-300"
          >
            Children
          </Label>
          <Input
            id="childrenAgent"
            type="number"
            min="0"
            value={children}
            onChange={(e) =>
              setChildren(Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            className="mt-1 h-11 bg-slate-700/50 border-slate-600 text-white focus-visible:ring-offset-0 focus-visible:ring-cyan-500"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full lg:w-auto bg-cyan-600 hover:bg-cyan-700 text-white h-11 shadow-md col-span-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SearchIcon className="mr-2 h-4 w-4" />
          )}
          Search Rooms
        </Button>
      </div>
    </form>
  );
};

export default AgentBookingParamsSection;
