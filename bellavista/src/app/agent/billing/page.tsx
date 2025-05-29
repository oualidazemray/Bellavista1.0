// src/app/agent/billing/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter as FilterIcon,
  Loader2,
  AlertTriangle,
  Eye,
  Printer,
  Mail,
  CalendarDays,
  User,
  Hotel as HotelIcon,
  RefreshCcw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  Clock,
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
import { Label } from "@/components/ui/label"; // Correct import for Label
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { ReservationStatus as PrismaReservationStatus } from "@prisma/client"; // For type consistency
import { BillableReservationItem } from "@/app/api/agent/billing-reservations/route"; // Import type from API

// Helper function to get display text and variant for reservation status badges
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

// Helper function to format ISO date strings
const formatDate = (isoString: string | undefined | null) => {
  if (!isoString) return "N/A";
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const AgentBillingPage = () => {
  const [reservations, setReservations] = useState<BillableReservationItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoicedFilter, setInvoicedFilter] = useState<"all" | "yes" | "no">(
    "no"
  ); // Default to show uninvoiced
  const [processingId, setProcessingId] = useState<string | null>(null); // For action button loading states

  const fetchBillableReservations = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });
        if (searchTerm) queryParams.set("search", searchTerm);
        if (invoicedFilter !== "all")
          queryParams.set("invoiced", invoicedFilter);

        console.log(
          `BILLING_PAGE: Fetching /api/agent/billing-reservations?${queryParams.toString()}`
        );
        const response = await fetch(
          `/api/agent/billing-reservations?${queryParams.toString()}`
        );

        const responseText = await response.text();
        console.log(
          `BILLING_PAGE: API Response Status: ${
            response.status
          }, Text: ${responseText.substring(0, 300)}`
        );

        if (!response.ok) {
          let errorMsg = `Failed to fetch billable reservations (Status: ${response.status})`;
          try {
            if (
              responseText &&
              response.headers.get("content-type")?.includes("application/json")
            ) {
              const errData = JSON.parse(responseText);
              errorMsg = errData.message || errData.detail || errorMsg;
            } else if (responseText) {
              errorMsg = `${errorMsg}. Server: ${responseText.substring(
                0,
                100
              )}`;
            }
          } catch (e) {
            console.error("Error parsing error response from billing API", e);
          }
          throw new Error(errorMsg);
        }
        const data: {
          reservations: BillableReservationItem[];
          totalPages: number;
          currentPage: number;
          totalReservations: number;
        } = JSON.parse(responseText);
        setReservations(data.reservations || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalItems(data.totalReservations || 0);
      } catch (err: any) {
        setError(err.message || "Could not load billable reservations.");
        toast.error(err.message || "Could not load billable reservations.");
        setReservations([]); // Clear on error
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, invoicedFilter]
  );

  useEffect(() => {
    fetchBillableReservations(currentPage);
  }, [currentPage, fetchBillableReservations]);

  const handleFilterSubmit = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchBillableReservations(1);
  };

  const handleGenerateInvoice = async (
    reservationId: string,
    clientEmail: string,
    sendEmailAction: boolean = false
  ) => {
    const actionKey = reservationId + (sendEmailAction ? "-send" : "-generate");
    setProcessingId(actionKey);
    const actionText = sendEmailAction
      ? "Generating & Sending Invoice"
      : "Generating Invoice";
    const toastId = toast.loading(`${actionText}...`);

    try {
      const response = await fetch(
        `/api/agent/reservations/${reservationId}/invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sendEmail: sendEmailAction,
            clientEmail: sendEmailAction ? clientEmail : undefined,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to process invoice.");
      toast.success(result.message || "Invoice processed!", { id: toastId });
      // Update the specific item in the list optimistically or refetch
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                invoiceId: result.invoiceId,
                invoiceFileUrl: result.fileUrl,
                invoiceSentByEmail: result.sentByEmail ?? r.invoiceSentByEmail,
              }
            : r
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to process invoice.", { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  // --- RENDER LOGIC ---
  if (isLoading && reservations.length === 0 && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Billing Information...</p>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl text-red-300">Error Loading Data</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <Button
          onClick={() => fetchBillableReservations(1)}
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
          <CreditCard size={30} className="text-cyan-400" /> Billing & Invoices
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBillableReservations(1)}
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
            <FilterIcon size={18} /> Filter Reservations
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label
              htmlFor="searchTermBilling"
              className="text-xs text-slate-400"
            >
              Search Client/Ref ID
            </Label>
            <Input
              id="searchTermBilling"
              type="text"
              placeholder="Client name, email, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 mt-1 focus:border-cyan-500 focus:ring-cyan-500"
            />
          </div>
          <div>
            <Label
              htmlFor="invoicedFilterBilling"
              className="text-xs text-slate-400"
            >
              Invoice Status
            </Label>
            <Select
              value={invoicedFilter}
              onValueChange={(val) => setInvoicedFilter(val as any)}
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:ring-cyan-500 focus:border-cyan-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all" className="focus:bg-slate-700">
                  All Completed/Out
                </SelectItem>
                <SelectItem value="no" className="focus:bg-slate-700">
                  Needs Invoice
                </SelectItem>
                <SelectItem value="yes" className="focus:bg-slate-700">
                  Invoice Generated
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleFilterSubmit}
            className="bg-cyan-600 hover:bg-cyan-700 text-white sm:mt-5"
          >
            <Search size={16} className="mr-2" /> Apply Filters
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
            <HotelIcon size={48} className="mx-auto mb-4 text-slate-500" />
            <p className="text-lg font-semibold text-slate-300">
              No Reservations to Bill
            </p>
            <p>
              No checked-out or completed reservations match your current
              filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reservations List */}
      {reservations.length > 0 && (
        <div className="space-y-4 mt-6">
          {reservations.map((res) => (
            <Card
              key={res.id}
              className="bg-slate-800/70 border-slate-700 text-white shadow-md hover:border-cyan-500/60 transition-all"
            >
              <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-cyan-300">
                      {res.clientName} -{" "}
                      <span className="text-slate-300 font-normal">
                        {res.hotelName}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Ref: {res.id.substring(0, 12)}... | Checked Out:{" "}
                      {formatDate(res.checkOut)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={getStatusProps(res.status).variant}
                    className="text-xs mt-1 sm:mt-0"
                  >
                    {getStatusProps(res.status).text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-slate-300 p-4 sm:p-5 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  <span>{res.clientEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  <span>{res.numberOfGuests} guests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-400" />
                  <span>Total: ${res.totalPrice.toFixed(2)}</span>
                </div>
                <div className="col-span-full text-xxs text-slate-500">
                  <Clock size={12} className="inline mr-1" />
                  Booked: {new Date(res.bookingDate).toLocaleString()}
                </div>

                {res.invoiceId && (
                  <div className="col-span-full mt-2 pt-2 border-t border-slate-700/50 text-xs">
                    <p className="text-green-400 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Invoice:{" "}
                      {res.invoiceId.substring(0, 8)}...
                    </p>
                    {res.invoiceFileUrl && (
                      <Link
                        href={res.invoiceFileUrl}
                        target="_blank"
                        className="text-cyan-400 hover:underline ml-5"
                      >
                        View PDF
                      </Link>
                    )}
                    {res.invoiceSentByEmail && (
                      <span className="text-slate-500 ml-2">(Email Sent)</span>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 sm:p-5 pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                {!res.invoiceId ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleGenerateInvoice(res.id, res.clientEmail, false)
                    }
                    disabled={processingId === res.id + "-generate"}
                    className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto text-xs"
                  >
                    {processingId === res.id + "-generate" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Printer size={14} className="mr-1.5" />
                    )}{" "}
                    Generate Invoice
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleGenerateInvoice(res.id, res.clientEmail, true)
                    }
                    disabled={
                      processingId === res.id + "-send" ||
                      res.invoiceSentByEmail === true
                    }
                    className="border-cyan-500/70 text-cyan-300 hover:bg-cyan-500/10 w-full sm:w-auto text-xs"
                  >
                    {processingId === res.id + "-send" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Mail size={14} className="mr-1.5" />
                    )}
                    {res.invoiceSentByEmail ? "Email Sent" : "Send by Email"}
                  </Button>
                )}
                <Link href={`/agent/reservations/${res.id}/details`} passHref>
                  {" "}
                  {/* Link to more detailed view */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white w-full sm:w-auto text-xs"
                  >
                    <Eye size={14} className="mr-1.5" /> View Booking
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalItems > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p className="text-xs">
            Showing {reservations.length > 0 ? (currentPage - 1) * 10 + 1 : 0} -{" "}
            {Math.min(currentPage * 10, totalItems)} of {totalItems}{" "}
            reservations
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
    </div>
  );
};

export default AgentBillingPage;
