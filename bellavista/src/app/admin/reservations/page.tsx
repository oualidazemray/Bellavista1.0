// src/app/admin/reservations/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Users,
  Hotel,
  DollarSign,
  Search,
  Filter as FilterIcon,
  Eye,
  ListFilter,
  RefreshCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { ReservationStatus as PrismaReservationStatus } from "@prisma/client"; // For type consistency
import { Button } from "@/components/ui/button"; // Assuming shadcn Button
import { Input } from "@/components/ui/input"; // Assuming shadcn Input
import { Label } from "@/components/ui/label"; // Assuming shadcn Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming shadcn Select
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card"; // Assuming shadcn Card
import { Badge } from "@/components/ui/badge"; // Assuming shadcn Badge
// If you implement date range filtering:
// import { DateRange } from "react-day-picker";
// import { DateRangePicker } from "@/components/ui/date-range-picker"; // Path to your DateRangePicker

// Interface matching AdminReservationListItem from your API /api/admin/all-reservations
interface ReservationListItem {
  id: string;
  clientName: string;
  clientEmail: string;
  hotelName: string; // This is likely the Room.name or derived
  roomTypes: string[]; // Array of room type strings
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string; // ISO string (createdAt)
  status: PrismaReservationStatus; // Keep Prisma status for direct comparison and display
}

interface FetchReservationsAdminResponse {
  reservations: ReservationListItem[];
  totalPages: number;
  currentPage: number;
  totalReservations: number;
}

// Helper to get a display-friendly string and variant for status badges
const getStatusProps = (
  status: PrismaReservationStatus
): {
  text: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info";
} => {
  const text = status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
  switch (status) {
    case PrismaReservationStatus.PENDING:
      return { text, variant: "warning" };
    case PrismaReservationStatus.CONFIRMED:
      return { text, variant: "success" };
    case PrismaReservationStatus.CHECKED_IN:
      return { text, variant: "info" };
    case PrismaReservationStatus.CHECKED_OUT:
      return { text, variant: "default" };
    case PrismaReservationStatus.COMPLETED:
      return { text, variant: "default" }; // Same as checked_out or distinct
    case PrismaReservationStatus.CANCELED:
      return { text, variant: "destructive" };
    default:
      return { text, variant: "secondary" };
  }
};

const AdminReservationsPage = () => {
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PrismaReservationStatus | ""
  >(""); // '' for all
  // const [dateRange, setDateRange] = useState<DateRange | undefined>(); // For date filtering

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModalFor, setShowRejectionModalFor] = useState<
    string | null
  >(null);

  const fetchAllReservations = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });
        if (searchTerm) queryParams.set("search", searchTerm);
        if (statusFilter) queryParams.set("status", statusFilter);
        // if (dateRange?.from) queryParams.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
        // if (dateRange?.to) queryParams.set('dateTo', dateRange.to.toISOString().split('T')[0]);

        const response = await fetch(
          `/api/admin/all-reservations?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch reservations" }));
          throw new Error(errData.message);
        }
        const data: FetchReservationsAdminResponse = await response.json();
        setReservations(data.reservations);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalReservations(data.totalReservations);
      } catch (err: any) {
        console.error("Error fetching reservations:", err);
        setError(err.message || "Could not load reservation data.");
        toast.error(err.message || "Could not load reservation data.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, statusFilter /*, dateRange*/]
  ); // Re-fetch if filters change

  useEffect(() => {
    fetchAllReservations(currentPage);
  }, [currentPage, fetchAllReservations]);

  const handleValidateReservation = async (
    reservationId: string,
    action: "confirm" | "reject",
    reason?: string
  ) => {
    setProcessingId(reservationId);
    const toastId = toast.loading(
      `${action === "confirm" ? "Confirming" : "Rejecting"} reservation...`
    );
    try {
      const response = await fetch(
        `/api/admin/reservations/${reservationId}/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            rejectionReason: action === "reject" ? reason : undefined,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || `Failed to ${action} reservation.`);
      toast.success(
        result.message ||
          `Reservation ${action === "confirm" ? "confirmed" : "rejected"}!`,
        { id: toastId }
      );
      fetchAllReservations(currentPage); // Refresh the list
      if (action === "reject") {
        setShowRejectionModalFor(null);
        setRejectionReason("");
      }
    } catch (err: any) {
      toast.error(err.message || `Error ${action}ing reservation.`, {
        id: toastId,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (reservationId: string) => {
    setRejectionReason("");
    setShowRejectionModalFor(reservationId);
  };

  const handleFilterSubmit = () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    fetchAllReservations(1);
  };

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString();

  if (isLoading && reservations.length === 0 && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Reservations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <ListFilter size={30} className="text-purple-400" /> All Hotel
          Reservations
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAllReservations(1)}
          disabled={isLoading}
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />{" "}
          <span className="ml-2">Refresh List</span>
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
            <FilterIcon size={18} /> Filter & Search Reservations
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Refine the list of reservations below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label
              htmlFor="searchTermAdminReservations"
              className="text-xs text-slate-400"
            >
              Search Term
            </Label>
            <Input
              id="searchTermAdminReservations"
              type="text"
              placeholder="Client, email, Ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="statusFilterAdminReservations"
              className="text-xs text-slate-400"
            >
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value === "all" ? "" : (value as PrismaReservationStatus)
                )
              }
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="focus:bg-slate-700">
                  Any Status
                </SelectItem>
                {Object.values(PrismaReservationStatus).map((s) => (
                  <SelectItem key={s} value={s} className="focus:bg-slate-700">
                    {getStatusProps(s).text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Placeholder for DateRangePicker */}
          {/* <div className="lg:col-span-1">
                <Label className="text-xs text-slate-400 block mb-1">Check-in Date Range</Label>
                <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
            </div> */}
          <Button
            onClick={handleFilterSubmit}
            className="bg-purple-600 hover:bg-purple-700 sm:mt-5 lg:col-start-4 lg:mt-0 lg:self-end"
          >
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {error && !isLoading && (
        <div className="p-4 bg-red-800/30 text-red-300 rounded-md text-center border border-red-500/50">
          <AlertTriangle className="inline w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {isLoading && reservations.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}
      {!isLoading && reservations.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700">
          No reservations found matching your current filters.
        </div>
      )}

      {/* Reservations Table */}
      {reservations.length > 0 && (
        <div className="overflow-x-auto bg-slate-800/60 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/40 divide-y divide-slate-700/50">
              {reservations.map((res) => (
                <tr
                  key={res.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {res.clientName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {res.clientEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-slate-200 font-medium">
                      {res.hotelName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {res.roomTypes.join(", ")}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ID:{" "}
                      <span className="font-mono">
                        {res.id.substring(0, 12)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    <div>
                      <span className="text-xs text-slate-500">In:</span>{" "}
                      {formatDate(res.checkIn)}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Out:</span>{" "}
                      {formatDate(res.checkOut)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-center">
                    {res.numberOfGuests}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-400 text-right">
                    ${res.totalPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <Badge
                      variant={getStatusProps(res.status).variant}
                      className="text-xs"
                    >
                      {getStatusProps(res.status).text}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-2">
                      {res.status === PrismaReservationStatus.PENDING && (
                        <>
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() =>
                              handleValidateReservation(res.id, "confirm")
                            }
                            disabled={processingId === res.id}
                            className="px-2 py-1 h-auto"
                          >
                            {processingId === res.id && (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            )}{" "}
                            <CheckCircle size={14} />{" "}
                            <span className="hidden sm:inline ml-1">
                              Confirm
                            </span>
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => openRejectionModal(res.id)}
                            disabled={processingId === res.id}
                            className="px-2 py-1 h-auto"
                          >
                            <XCircle size={14} />{" "}
                            <span className="hidden sm:inline ml-1">
                              Reject
                            </span>
                          </Button>
                        </>
                      )}
                      <Link
                        href={`/admin/reservations/${res.id}/details`}
                        passHref
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-600 text-slate-400 hover:text-purple-300 hover:border-purple-500"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalReservations > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p className="text-xs">
            Showing {reservations.length} of {totalReservations} reservations
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
            <span className="px-3 py-1.5 border border-slate-700 rounded-md bg-slate-800">
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

      {/* Rejection Modal (same as before) */}
      {showRejectionModalFor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                <AlertTriangle /> Reject Reservation
              </h3>
              <button
                onClick={() => setShowRejectionModalFor(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-1">
              Ref ID:{" "}
              <span className="font-mono text-xs">
                {showRejectionModalFor.substring(0, 12)}...
              </span>
            </p>
            <div className="mb-4">
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Reason for Rejection
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full p-2.5 bg-slate-700 border border-slate-500 rounded-md text-white placeholder-slate-400"
                placeholder="Provide a reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowRejectionModalFor(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  handleValidateReservation(
                    showRejectionModalFor!,
                    "reject",
                    rejectionReason
                  )
                }
                disabled={
                  !rejectionReason.trim() ||
                  processingId === showRejectionModalFor
                }
              >
                {processingId === showRejectionModalFor ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}{" "}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservationsPage;
