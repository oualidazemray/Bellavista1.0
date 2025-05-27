// src/app/admin/alerts/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BellRing,
  Check,
  X,
  Eye,
  Info,
  EyeOff,
  Trash2,
  Loader2,
  AlertTriangle,
  Filter,
  CheckCircle,
  RefreshCcw,
  ChevronRight,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button"; // Assuming shadcn Button
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Assuming shadcn Badge
import { AlertType as PrismaAlertType } from "@prisma/client";

// Interface matching AdminAlertItem from API
interface AlertItem {
  id: string;
  type: PrismaAlertType;
  message: string;
  createdAt: string; // ISO String
  read: boolean;
}

interface FetchAlertsResponse {
  alerts: AlertItem[];
  totalPages: number;
  currentPage: number;
  totalAlerts: number;
}

const getAlertTypeStyle = (type: PrismaAlertType) => {
  switch (type) {
    case "PENDING_RESERVATION":
      return {
        icon: <BellRing className="h-4 w-4 mr-1.5" />,
        color: "yellow",
        label: "Pending Reservation",
      };
    case "LOW_OCCUPANCY":
      return {
        icon: <TrendingUp className="h-4 w-4 mr-1.5 rotate-180" />,
        color: "blue",
        label: "Low Occupancy",
      }; // Example, TrendingDown might be better
    case "HIGH_DEMAND":
      return {
        icon: <TrendingUp className="h-4 w-4 mr-1.5" />,
        color: "red",
        label: "High Demand",
      };
    default:
      return {
        icon: <Info className="h-4 w-4 mr-1.5" />,
        color: "gray",
        label: "General",
      };
  }
};

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("unread"); // Default to unread
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(
    async (page: number, currentFilter: typeof filter) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10", // Or your preferred limit
          filter: currentFilter,
        });
        const response = await fetch(
          `/api/admin/alerts?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch alerts" }));
          throw new Error(errData.message);
        }
        const data: FetchAlertsResponse = await response.json();
        setAlerts(data.alerts);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAlerts(currentPage, filter);
  }, [currentPage, filter, fetchAlerts]);

  const handleToggleRead = async (
    alertId: string,
    currentReadStatus: boolean
  ) => {
    setProcessingId(alertId);
    const newReadStatus = !currentReadStatus;
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readStatus: newReadStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      setAlerts((prevAlerts) =>
        prevAlerts.map((a) =>
          a.id === alertId ? { ...a, read: newReadStatus } : a
        )
      );
    } catch (err: any) {
      toast.error(
        err.message || `Failed to mark as ${newReadStatus ? "read" : "unread"}`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setProcessingId("all"); // Special ID for "all" operation
    const toastId = toast.loading("Marking all as read...");
    try {
      const response = await fetch("/api/admin/alerts", { method: "POST" }); // POST to root endpoint
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message, { id: toastId });
      fetchAlerts(1, "unread"); // Refresh to show only unread (which should be none) or switch to 'all'
      setFilter("unread"); // Switch to unread tab to see effect
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all as read.", {
        id: toastId,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm("Are you sure you want to dismiss this alert?")) return;
    setProcessingId(alertId);
    const toastId = toast.loading("Dismissing alert...");
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message, { id: toastId });
      setAlerts((prevAlerts) => prevAlerts.filter((a) => a.id !== alertId)); // Optimistic update
    } catch (err: any) {
      toast.error(err.message || "Failed to dismiss alert.", { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading && alerts.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />{" "}
        <span className="ml-2 text-slate-300">Loading System Alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <BellRing size={30} className="text-purple-400" /> System Alerts
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAlerts(1, filter)}
            disabled={isLoading}
          >
            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="ml-2">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isLoading || alerts.filter((a) => !a.read).length === 0}
          >
            <Check className="mr-2 h-4 w-4" /> Mark all as Read
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
        {(["unread", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setFilter(f);
              setCurrentPage(1);
            }}
            className={`capitalize ${
              filter === f
                ? "bg-purple-600 hover:bg-purple-700"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            {f} Alerts
          </Button>
        ))}
      </div>

      {error && !isLoading && (
        <div className="p-4 bg-red-800/30 text-red-300 rounded-md text-center">
          {error}
        </div>
      )}

      {alerts.length === 0 && !isLoading && (
        <div className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          No {filter === "unread" ? "new " : ""}alerts at this time. System is
          looking good!
        </div>
      )}

      <div className="space-y-4">
        {alerts.map((alert) => {
          const styleInfo = getAlertTypeStyle(alert.type);
          return (
            <Card
              key={alert.id}
              className={`bg-slate-800/70 border-slate-700 text-white shadow-md ${
                alert.read
                  ? "opacity-60 border-l-slate-600"
                  : `border-l-4 border-${styleInfo.color}-500 hover:shadow-${styleInfo.color}-500/20`
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge
                      variant={alert.read ? "secondary" : "default"}
                      className={`capitalize bg-${styleInfo.color}-500/20 text-${styleInfo.color}-300 border-${styleInfo.color}-500/50`}
                    >
                      {styleInfo.icon} {styleInfo.label}
                    </Badge>
                    <CardTitle
                      className={`text-lg mt-2 ${
                        alert.read ? "text-slate-400" : "text-white"
                      }`}
                    >
                      {alert.message}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={processingId === alert.id}
                    className="text-slate-400 hover:text-red-400"
                  >
                    {processingId === alert.id && processingId !== "all" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 pt-0">
                <p>Received: {new Date(alert.createdAt).toLocaleString()}</p>
              </CardContent>
              <CardFooter className="pt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRead(alert.id, alert.read)}
                  disabled={processingId === alert.id}
                  className={`border-${
                    alert.read ? "green" : "yellow"
                  }-500/50 text-${
                    alert.read ? "green" : "yellow"
                  }-400 hover:bg-${alert.read ? "green" : "yellow"}-500/10`}
                >
                  {processingId === alert.id && processingId !== "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : alert.read ? (
                    <EyeOff className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1.5" />
                  )}
                  Mark as {alert.read ? "Unread" : "Read"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Pagination (if totalPages > 1) */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 text-sm text-slate-300">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} className="mr-1" /> Prev
          </Button>
          <span>
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
      )}
    </div>
  );
};

export default AdminAlertsPage;
