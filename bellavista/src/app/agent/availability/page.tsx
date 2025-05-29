// src/app/agent/availability/page.tsx
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import Image from "next/image"; // If you plan to use Next/Image for hotel/room previews
import {
  Calendar as CalendarIcon,
  BedDouble,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  Hotel as HotelIcon, // Renamed to avoid conflict with a potential 'Hotel' type
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // shadcn Calendar
import { DateRange } from "react-day-picker";
import { format, addDays, differenceInCalendarDays } from "date-fns"; // date-fns for robust date handling
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RoomType as PrismaRoomType } from "@prisma/client"; // Import from Prisma for filter

// Interface matching the API response for each room's availability
// This should match the RoomAvailabilityItem from your API route
export interface RoomAvailabilityItem {
  roomId: string;
  roomName: string;
  roomNumber: string;
  roomType: string; // String representation of PrismaRoomType (e.g., "SUITE")
  maxGuests: number;
  isAvailableForEntireRange: boolean;
  conflictingReservationIds?: string[];
  // hotelImageUrl?: string | null; // If you add this to API response for better display
}

const today = new Date();
today.setHours(0, 0, 0, 0); // Normalize to start of day

const AgentRoomAvailabilityPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 7), // Default to check for the next 7 days
  });
  const [roomTypeFilter, setRoomTypeFilter] = useState<PrismaRoomType | "">("");
  const [availabilityData, setAvailabilityData] = useState<
    RoomAvailabilityItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false); // Start false, true on fetch
  const [error, setError] = useState<string | null>(null);

  const formatDateForDisplay = (date: Date | undefined | null): string => {
    if (!date) return "N/A";
    return format(date, "LLL dd, yyyy"); // Using date-fns format
  };

  const fetchAvailability = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select a valid date range.");
      return;
    }
    if (dateRange.from >= dateRange.to) {
      toast.error("End date must be after start date.");
      return;
    }
    const todayComparison = new Date();
    todayComparison.setHours(0, 0, 0, 0);
    if (dateRange.from < todayComparison) {
      toast.error("Start date cannot be in the past for availability check.");
      // Or adjust dateRange.from to today if you prefer auto-correction
      // setDateRange(prev => ({...prev, from: todayComparison}));
      // return; // Prevent fetch if start date is invalid
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        roomTypeFilter: roomTypeFilter || undefined,
      };
      console.log("AVAILABILITY_PAGE: Fetching with payload:", payload);

      const response = await fetch("/api/agent/room-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(
        `AVAILABILITY_PAGE: API Response Status: ${
          response.status
        }, Text: ${responseText.substring(0, 200)}`
      );

      if (!response.ok) {
        let errorMsg = `Failed to fetch availability (Status: ${response.status})`;
        try {
          if (
            responseText &&
            response.headers.get("content-type")?.includes("application/json")
          ) {
            const errData = JSON.parse(responseText);
            errorMsg = errData.message || errData.detail || errorMsg;
          } else if (responseText) {
            errorMsg = `${errorMsg}. Server response: ${responseText.substring(
              0,
              100
            )}`;
          }
        } catch (e) {
          console.error(
            "Error parsing error response from availability API",
            e
          );
        }
        throw new Error(errorMsg);
      }
      const data: RoomAvailabilityItem[] = JSON.parse(responseText);
      setAvailabilityData(data);
      if (data.length === 0 && !payload.roomTypeFilter) {
        // Only toast if no filters and no results
        toast.info(
          "All rooms appear available or no rooms match general criteria for this period."
        );
      } else if (data.length === 0 && payload.roomTypeFilter) {
        toast.info(
          `No rooms of type '${
            PrismaRoomType[payload.roomTypeFilter]
          }' found or all are available/booked for this period.`
        );
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Could not load room availability.");
      setAvailabilityData([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, roomTypeFilter]);

  // Fetch on initial mount and when dateRange or roomTypeFilter changes (debounced if needed)
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      // Only fetch if dates are set
      fetchAvailability();
    }
  }, [fetchAvailability]); // fetchAvailability itself depends on dateRange and roomTypeFilter

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchAvailability(); // Trigger fetch with current state values
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <BedDouble size={30} className="text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Room Availability
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAvailability}
          disabled={isLoading}
        >
          <RefreshCcw
            size={16}
            className={isLoading ? "animate-spin mr-2" : "mr-2"}
          />{" "}
          Refresh
        </Button>
      </div>
      <p className="text-slate-400 -mt-6 mb-6 text-sm">
        Check room occupancy for selected dates and types to assist with
        bookings.
      </p>

      <Card className="bg-slate-800/70 border-slate-700/50 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Select Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div className="lg:col-span-2">
              <Label
                htmlFor="availabilityDateRange"
                className="text-xs text-slate-400"
              >
                Date Range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="availabilityDateRange"
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal mt-1 h-11 ${
                      !dateRange?.from ? "text-muted-foreground" : "text-white"
                    } bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 focus:ring-1 focus:ring-cyan-500`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateForDisplay(dateRange.from)} -{" "}
                          {formatDateForDisplay(dateRange.to)}
                        </>
                      ) : (
                        formatDateForDisplay(dateRange.from)
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
                      date <
                      new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label
                htmlFor="roomTypeAvailabilityFilter"
                className="text-xs text-slate-400"
              >
                Room Type
              </Label>
              <Select
                value={roomTypeFilter}
                onValueChange={(val) =>
                  setRoomTypeFilter(
                    val === "all" ? "" : (val as PrismaRoomType)
                  )
                }
              >
                <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white h-11 focus:ring-1 focus:ring-cyan-500">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all" className="focus:bg-slate-700">
                    All Types
                  </SelectItem>
                  {Object.values(PrismaRoomType).map((rt) => (
                    <SelectItem
                      key={rt}
                      value={rt}
                      className="focus:bg-slate-700"
                    >
                      {rt.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-11 w-full lg:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}{" "}
              Check
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && availabilityData.length === 0 && (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />{" "}
          <p className="mt-2 text-slate-300">Checking room availability...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="p-4 my-4 bg-red-800/30 text-red-300 rounded-md text-center border border-red-500/50">
          <AlertTriangle className="inline w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {!isLoading &&
        !error &&
        availabilityData.length === 0 &&
        dateRange?.from && (
          <Card className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700 mt-6">
            <CardContent>
              <HotelIcon size={48} className="mx-auto mb-4 text-slate-500" />
              <p className="text-lg font-semibold text-slate-300">
                No Rooms Found or All Available
              </p>
              <p>
                No specific booking conflicts found for the selected criteria,
                or no rooms match your filter.
              </p>
            </CardContent>
          </Card>
        )}

      {!isLoading && availabilityData.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-white">
            Availability from {formatDateForDisplay(dateRange?.from)} to{" "}
            {formatDateForDisplay(dateRange?.to)}:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availabilityData.map((room) => (
              <Card
                key={room.roomId}
                className={`border-l-4 rounded-lg shadow-md
                ${
                  room.isAvailableForEntireRange
                    ? "border-green-500 bg-slate-800/70 hover:bg-slate-700/90"
                    : "border-red-500 bg-slate-800/90 hover:bg-slate-700/90"
                } 
                text-white transition-all duration-200`}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle
                    className="text-base font-semibold text-slate-100 truncate"
                    title={room.roomName}
                  >
                    {room.roomName}{" "}
                    <span className="text-xs text-slate-400">
                      ({room.roomNumber})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    {room.roomType} - Max {room.maxGuests} guests
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {room.isAvailableForEntireRange ? (
                    <Badge variant="success" className="text-xs font-medium">
                      <CheckCircle size={14} className="mr-1.5" /> Fully
                      Available
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-xs font-medium"
                    >
                      <XCircle size={14} className="mr-1.5" /> Booked/Partial
                    </Badge>
                  )}
                  {room.conflictingReservationIds &&
                    room.conflictingReservationIds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xxs text-slate-400">
                          Conflicts: {room.conflictingReservationIds.length}{" "}
                          booking(s)
                        </p>
                        {/* <ul className="list-disc list-inside text-xxs text-slate-500 max-h-16 overflow-y-auto">
                            {room.conflictingReservationIds.map(id => <li key={id} className="truncate" title={id}>{id.substring(0,8)}...</li>)}
                        </ul> */}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentRoomAvailabilityPage;
