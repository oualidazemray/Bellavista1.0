// src/app/admin/feedbacks/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Star,
  User,
  CalendarDays,
  Hotel,
  Search,
  Filter,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import toast from "react-hot-toast";
// If using DateRangePicker for date filtering
// import { DateRangePicker } from "@/components/ui/date-range-picker";
// import { DateRange } from "react-day-picker";

// Interface matching AdminFeedbackItem from API
interface FeedbackItem {
  id: string;
  userName: string;
  userEmail: string;
  reservationId: string;
  hotelName?: string;
  rating: number;
  message: string;
  createdAt: string; // ISO String
}

interface FetchFeedbacksResponse {
  feedbacks: FeedbackItem[];
  totalPages: number;
  currentPage: number;
  totalFeedbacks: number;
}

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`mr-0.5 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-slate-600 text-slate-500"
        }`}
      />
    ))}
    <span className="ml-1.5 text-xs text-slate-400">({rating}/5)</span>
  </div>
);

const AdminFeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>(""); // '1' through '5', or '' for all
  // const [dateRange, setDateRange] = useState<DateRange | undefined>(); // For date filtering

  const fetchFeedbacks = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10", // Or your preferred limit
        });
        if (searchTerm) queryParams.set("search", searchTerm);
        if (ratingFilter) queryParams.set("rating", ratingFilter);
        // if (dateRange?.from) queryParams.set('startDate', dateRange.from.toISOString());
        // if (dateRange?.to) queryParams.set('endDate', dateRange.to.toISOString());

        const response = await fetch(
          `/api/admin/feedbacks?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch feedbacks" }));
          throw new Error(errData.message);
        }
        const data: FetchFeedbacksResponse = await response.json();
        setFeedbacks(data.feedbacks);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalFeedbacks(data.totalFeedbacks);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, ratingFilter /*, dateRange*/]
  ); // Add dateRange if using it

  useEffect(() => {
    fetchFeedbacks(currentPage);
  }, [currentPage, fetchFeedbacks]); // fetchFeedbacks will change if filters change

  const handleFilterSubmit = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchFeedbacks(1); // Trigger fetch with new filters
  };

  const handleDeleteFeedback = async (feedbackId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete feedback from ${userName} (ID: ${feedbackId})? This is permanent.`
      )
    ) {
      return;
    }
    const toastId = toast.loading(`Deleting feedback ${feedbackId}...`);
    try {
      const response = await fetch(`/api/admin/feedbacks?id=${feedbackId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to delete feedback.");
      toast.success(result.message, { id: toastId });
      fetchFeedbacks(currentPage); // Refresh
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  if (isLoading && feedbacks.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />{" "}
        <span className="ml-2 text-slate-300">Loading Feedbacks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={30} className="text-purple-400" /> User Feedbacks
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFeedbacks(1)}
          disabled={isLoading}
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />{" "}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
            <Filter size={18} /> Filter Feedbacks
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label
              htmlFor="searchTermFeedback"
              className="text-xs text-slate-400"
            >
              Search Term
            </Label>
            <Input
              id="searchTermFeedback"
              type="text"
              placeholder="User, email, reservation ID, message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <Label
              htmlFor="ratingFilterFeedback"
              className="text-xs text-slate-400"
            >
              Rating
            </Label>
            <Select
              value={ratingFilter}
              onValueChange={(value) =>
                setRatingFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="hover:bg-slate-700">
                  Any Rating
                </SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem
                    key={r}
                    value={r.toString()}
                    className="hover:bg-slate-700"
                  >
                    {r} Star{r > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Add DateRangePicker here if desired */}
          {/* <div><Label className="text-xs text-slate-400">Date Range</Label><DateRangePicker onUpdate={(values) => setDateRange(values.range)} /></div> */}
          <Button
            onClick={handleFilterSubmit}
            className="bg-purple-600 hover:bg-purple-700 sm:mt-5"
          >
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {error && !isLoading && (
        <div className="p-4 bg-red-800/30 text-red-300 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Feedbacks List */}
      {isLoading && feedbacks.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}
      {!isLoading && feedbacks.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700">
          No feedbacks found matching your criteria.
        </div>
      )}

      <div className="space-y-4">
        {feedbacks.map((fb) => (
          <Card
            key={fb.id}
            className="bg-slate-800/70 border-slate-700 text-white shadow-md hover:border-purple-500/60"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-md font-semibold text-purple-300">
                    {fb.hotelName || "N/A Hotel"} (Ref:{" "}
                    {fb.reservationId.substring(0, 8)}...)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">
                    By: {fb.userName} ({fb.userEmail}) on{" "}
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <StarRatingDisplay rating={fb.rating} />
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-200 pt-0 pb-4">
              <p className="whitespace-pre-wrap">{fb.message}</p>
            </CardContent>
            <CardFooter className="pt-3 border-t border-slate-700/50 flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteFeedback(fb.id, fb.userName)}
                disabled={processingId === fb.id}
              >
                {processingId === fb.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1.5" />
                )}
                Dismiss
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {!isLoading && totalFeedbacks > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p>
            Showing {feedbacks.length} of {totalFeedbacks} feedbacks
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>
            <span className="px-2 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbacksPage;
