// src/app/agent/reservations/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardEdit,
  Search,
  Filter as FilterIcon,
  Loader2,
  AlertTriangle,
  Eye,
  LogIn,
  LogOut as LogOutIcon,
  CheckCircle,
  XCircle,
  CalendarDays,
  Users,
  Hotel,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ListFilter, // Added ListFilter for page title
} from "lucide-react";
import { Button } from "@/components/ui/button"; // shadcn/ui
import { Input } from "@/components/ui/input"; // shadcn/ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // shadcn/ui
import { Label } from "@/components/ui/label"; // shadcn/ui - Correct import for form labels
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"; // shadcn/ui
import { Badge } from "@/components/ui/badge"; // shadcn/ui
import toast from "react-hot-toast";
import { ReservationStatus as PrismaReservationStatus } from "@prisma/client"; // For type consistency

// Interface matching AgentReservationListItem from API
interface ReservationListItem {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  roomNames: string[]; // Array of strings like "Deluxe Room (101)"
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  numberOfGuests: number;
  totalPrice: number;
  bookingDate: string; // ISO string
  status: PrismaReservationStatus;
}
interface FetchReservationsAgentResponse {
  reservations: ReservationListItem[];
  totalPages: number;
  currentPage: number;
  totalReservations: number;
}

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
      return { text, variant: "default" };
    case PrismaReservationStatus.CANCELED:
      return { text, variant: "destructive" };
    default:
      return { text, variant: "secondary" };
  }
};
const formatDate = (isoString: string) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AgentManageReservationsPage = () => {
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PrismaReservationStatus | ""
  >("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  // For date range filtering (optional feature)
  // const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchAgentReservations = useCallback(
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

        // Ensure this API endpoint is correct and allows AGENT role
        const response = await fetch(
          `/api/admin/all-reservations?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch reservations" }));
          throw new Error(errData.message);
        }
        const data: FetchReservationsAgentResponse = await response.json();
        setReservations(data.reservations);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalReservations(data.totalReservations);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message || "Could not load reservations");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, statusFilter /*, dateRange*/]
  ); // Add dateRange if using it

  useEffect(() => {
    fetchAgentReservations(currentPage);
  }, [currentPage, fetchAgentReservations]);

  const handleFilterSubmit = () => {
    setCurrentPage(1);
    fetchAgentReservations(1);
  };

  const handleStatusUpdate = async (
    reservationId: string,
    newStatus:
      | PrismaReservationStatus.CHECKED_IN
      | PrismaReservationStatus.CHECKED_OUT
  ) => {
    setProcessingId(reservationId);
    const actionText =
      newStatus === PrismaReservationStatus.CHECKED_IN
        ? "Checking In"
        : "Checking Out";
    const toastId = toast.loading(`${actionText} reservation...`);
    try {
      const response = await fetch(
        `/api/agent/reservations/${reservationId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || `Failed to ${actionText.toLowerCase()} reservation.`
        );
      toast.success(
        result.message || `Reservation ${actionText.toLowerCase()} successful!`,
        { id: toastId }
      );
      fetchAgentReservations(currentPage); // Refresh list
    } catch (err: any) {
      toast.error(err.message || `Error ${actionText.toLowerCase()}.`, {
        id: toastId,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading && reservations.length === 0 && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Reservations...</p>
        <p className="text-sm text-slate-500">Fetching booking information.</p>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl text-red-300">Error Loading Reservations</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <Button
          onClick={() => fetchAgentReservations(1)}
          variant="outline"
          className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/10"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <ClipboardEdit size={30} className="text-cyan-400" /> Manage Guest
          Reservations
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAgentReservations(1)}
          disabled={isLoading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
        >
          <RefreshCcw
            size={16}
            className={isLoading ? "animate-spin mr-2" : "mr-2"}
          />{" "}
          Refresh
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
            <FilterIcon size={18} /> Filter & Search Bookings
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Refine the list of reservations below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label
              htmlFor="searchTermAgentRes"
              className="text-xs text-slate-400"
            >
              Search Term
            </Label>
            <Input
              id="searchTermAgentRes"
              type="text"
              placeholder="Client, Email, Ref ID, Room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 mt-1 focus:border-cyan-500 focus:ring-cyan-500"
            />
          </div>
          <div>
            <Label
              htmlFor="statusFilterAgentRes"
              className="text-xs text-slate-400"
            >
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(
                  val === "all" ? "" : (val as PrismaReservationStatus)
                )
              }
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:ring-cyan-500 focus:border-cyan-500">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem
                  value="all"
                  className="focus:bg-slate-700 hover:bg-slate-700"
                >
                  All Statuses
                </SelectItem>
                {Object.values(PrismaReservationStatus).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="focus:bg-slate-700 hover:bg-slate-700"
                  >
                    {getStatusProps(s).text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Placeholder for DateRangePicker for dateFrom/dateTo */}
          <div className="lg:col-span-1">
            {/* <Label className="text-xs text-slate-400 block mb-1">Check-in Date Range</Label> */}
            {/* <DateRangePicker onUpdate={(values) => setDateRange(values.range)} /> */}
          </div>
          <Button
            onClick={handleFilterSubmit}
            className="bg-cyan-600 hover:bg-cyan-700 text-white sm:mt-5 lg:col-start-4 lg:mt-0 lg:self-end"
          >
            <Search size={16} className="mr-2" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {isLoading && reservations.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      )}

      {!isLoading && reservations.length === 0 && !error && (
        <Card className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700 mt-6">
          <CardContent>
            <Hotel size={48} className="mx-auto mb-4 text-slate-500" />
            <p className="text-lg font-semibold text-slate-300">
              No Reservations Found
            </p>
            <p>No bookings match your current filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {reservations.length > 0 && (
        <div className="overflow-x-auto bg-slate-800/60 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 mt-6">
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
                  className="hover:bg-slate-700/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    <div className="text-sm font-medium text-white">
                      {res.clientName}
                    </div>
                    <div className="text-xs text-slate-400 hover:text-cyan-300 transition-colors">
                      <Link href={`mailto:${res.clientEmail}`}>
                        {res.clientEmail}
                      </Link>
                    </div>
                    {res.clientPhone && (
                      <div className="text-xs text-slate-500">
                        {res.clientPhone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    <div className="text-sm text-slate-200 font-medium">
                      {res.hotelName}
                    </div>
                    <div
                      className="text-xs text-slate-400 truncate max-w-[200px]"
                      title={res.roomTypes.join(", ")}
                    >
                      {res.roomTypes.join(", ")}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Ref:{" "}
                      <span className="font-mono">
                        {res.id.substring(0, 12)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 align-top">
                    <div>
                      <span className="text-xs text-slate-500">In:</span>{" "}
                      {formatDate(res.checkIn)}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Out:</span>{" "}
                      {formatDate(res.checkOut)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-center align-top">
                    {res.numberOfGuests}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-400 text-right align-top">
                    ${res.totalPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center align-top">
                    <Badge
                      variant={getStatusProps(res.status).variant}
                      className="text-xs px-2.5 py-1 font-medium"
                    >
                      {getStatusProps(res.status).text}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium align-top">
                    <div className="flex items-center justify-center gap-1.5">
                      {res.status === PrismaReservationStatus.CONFIRMED && (
                        <Button
                          size="xs"
                          variant="success"
                          onClick={() =>
                            handleStatusUpdate(
                              res.id,
                              PrismaReservationStatus.CHECKED_IN
                            )
                          }
                          disabled={processingId === res.id}
                          className="px-2 py-1 h-auto text-xs"
                        >
                          {processingId === res.id && processingId !== "all" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <LogIn size={14} />
                          )}
                          <span className="hidden sm:inline ml-1">
                            Check In
                          </span>
                        </Button>
                      )}
                      {res.status === PrismaReservationStatus.CHECKED_IN && (
                        <Button
                          size="xs"
                          variant="warning"
                          onClick={() =>
                            handleStatusUpdate(
                              res.id,
                              PrismaReservationStatus.CHECKED_OUT
                            )
                          }
                          disabled={processingId === res.id}
                          className="px-2 py-1 h-auto text-xs"
                        >
                          {processingId === res.id && processingId !== "all" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <LogOutIcon size={14} />
                          )}
                          <span className="hidden sm:inline ml-1">
                            Check Out
                          </span>
                        </Button>
                      )}
                      {res.status === PrismaReservationStatus.PENDING && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            toast.info(
                              "Admins handle PENDING status via validation page."
                            );
                          }}
                          className="px-2 py-1 h-auto text-xs border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10"
                        >
                          <AlertTriangle size={14} />
                          <span className="hidden sm:inline ml-1">
                            Validate
                          </span>
                        </Button>
                      )}
                      <Link
                        href={`/agent/reservations/${res.id}/details`}
                        passHref
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-cyan-300"
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

      {/* Pagination Controls */}
      {!isLoading && totalReservations > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p className="text-xs">
            Showing {reservations.length > 0 ? (currentPage - 1) * 10 + 1 : 0} -{" "}
            {Math.min(currentPage * 10, totalReservations)} of{" "}
            {totalReservations} reservations
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-slate-600 hover:bg-slate-700/50"
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </Button>
            <span className="px-3 py-1.5 border border-slate-700 rounded-md bg-slate-800 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-slate-600 hover:bg-slate-700/50"
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Rejection Modal - If agents need to reject PENDING reservations directly on this page */}
      {/*
      {showRejectionModalFor && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-600">
            ... Rejection Modal Content ...
          </div>
        </div>
      )}
      */}
    </div>
  );
};

export default AgentManageReservationsPage;
