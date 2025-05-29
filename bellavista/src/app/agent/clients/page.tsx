// src/app/agent/clients/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link"; // Keep for potential future links
import {
  Users as UsersIcon, // Main icon for the page
  UserPlus, // For "Add New Client"
  Edit3 as EditIcon, // For "Edit Client" (using Edit3 for a slightly different look)
  Trash2, // For "Delete Client"
  Search, // For search input
  Loader2, // For loading states
  AlertTriangle, // For error messages
  ChevronLeft, // For pagination
  ChevronRight, // For pagination
  RefreshCcw, // For refresh button
  CheckCircle, // For email verified status
  XCircle, // For email not verified status
  Filter as FilterIcon, // For filter section title (optional)
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "recharts";
// Remove Select if not using role filter on this page for agents
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import toast from "react-hot-toast";
import { Role } from "@prisma/client"; // For types, if needed by UserFormModal

// Assuming UserFormModal is adapted to handle CLIENT creation/editing by an AGENT
// And it expects EditableUserData which might be a subset or specific form of User data
import UserFormModal, {
  EditableUserData,
} from "@/components/ui/agent/AgentClientFormModal";
// Interface for client data displayed in the table/list
// This should match what GET /api/agent/manage-clients returns in its 'clients' array
interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isEmailVerified: boolean;
  createdAt: string; // ISO string from API
  role: Role; // Should always be CLIENT if API filters correctly
}

interface FetchClientsAgentResponse {
  clients: ClientListItem[];
  totalPages: number;
  currentPage: number;
  totalClients: number;
}

const formatDate = (isoString: string) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AgentClientsManagementPage = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  // For agents, we typically only manage CLIENTs, so role filter might not be needed here
  // const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<EditableUserData | null>(
    null
  );

  const fetchClients = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10", // Items per page
        });
        if (searchTerm.trim()) queryParams.set("search", searchTerm.trim());
        // If you add other filters (e.g., verified status), add them here:
        // if (verifiedFilter) queryParams.set('verified', verifiedFilter);

        const response = await fetch(
          `/api/agent/manage-clients?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch client accounts" }));
          throw new Error(errData.message || "Failed to fetch client data.");
        }
        const data: FetchClientsAgentResponse = await response.json();
        setClients(data.clients);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage); // Ensure API returns this
        setTotalClients(data.totalClients);
      } catch (err: any) {
        setError(err.message || "Could not load client data.");
        toast.error(err.message || "Could not load client data.");
        setClients([]); // Clear on error
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm /*, verifiedFilter */]
  ); // Add other filter states if they affect the query

  useEffect(() => {
    fetchClients(currentPage);
  }, [currentPage, fetchClients]); // fetchClients is memoized by useCallback

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setCurrentPage(1); // Reset to first page for new search/filter
    fetchClients(1);
  };

  const openCreateClientModal = () => {
    setEditingClient(null); // Ensure modal is in "create" mode
    setIsClientModalOpen(true);
  };

  const openEditClientModal = async (clientId: string) => {
    const toastId = toast.loading("Fetching client details...");
    try {
      // API endpoint for AGENT to get a specific CLIENT's details
      const response = await fetch(`/api/agent/manage-clients/${clientId}`);
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ message: "Client details not found" }));
        throw new Error(errData.message || "Client details not found");
      }
      const clientDataFromApi: ClientListItem = await response.json(); // API should return all editable fields

      // Map to EditableUserData if necessary, assuming UserFormModal expects it
      const clientDataForModal: EditableUserData = {
        id: clientDataFromApi.id,
        name: clientDataFromApi.name,
        email: clientDataFromApi.email,
        phone: clientDataFromApi.phone,
        isEmailVerified: clientDataFromApi.isEmailVerified,
        role: Role.CLIENT, // Agent should only edit clients
        // Map other fields like taxId, bio if they are part of EditableUserData and fetched
        // taxId: clientDataFromApi.profile?.taxId, (if profile is included)
        // bio: clientDataFromApi.bio,
      };

      setEditingClient(clientDataForModal);
      setIsClientModalOpen(true);
      toast.dismiss(toastId);
    } catch (err: any) {
      toast.error(
        err.message || "Failed to fetch client details for editing.",
        { id: toastId }
      );
      console.error("Error fetching client for edit:", err);
    }
  };

  const handleClientSaved = () => {
    // Called after modal successfully creates or edits
    fetchClients(currentPage); // Refresh the current page of clients
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete client "${clientName}" (ID: ${clientId})? This may also delete their associated data like reservations and feedback if not handled by cascading rules or soft deletes.`
      )
    ) {
      return;
    }
    const toastId = toast.loading(`Deleting client ${clientName}...`);
    try {
      // API endpoint for AGENT to delete a CLIENT
      const response = await fetch(`/api/agent/manage-clients/${clientId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to delete client.");
      toast.success(
        result.message || `Client ${clientName} deleted successfully.`,
        { id: toastId }
      );
      // If current page becomes empty after deletion, go to previous page or first page
      if (clients.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchClients(currentPage);
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting client.", { id: toastId });
      console.error("Error deleting client:", err);
    }
  };

  if (isLoading && clients.length === 0 && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-xl text-slate-300">Loading Client Accounts...</p>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-xl text-red-300">Error Loading Clients</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <Button
          onClick={() => fetchClients(1)}
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
          <UsersIcon size={30} className="text-cyan-400" /> Client Account
          Management
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClients(currentPage)}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <RefreshCcw
              size={16}
              className={isLoading ? "animate-spin mr-2" : "mr-2"}
            />{" "}
            Refresh
          </Button>
          <Button
            onClick={openCreateClientModal}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <UserPlus size={18} className="mr-2" /> Add New Client
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
            <Search size={18} /> Search Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilterSubmit();
            }}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-grow">
              <Label
                htmlFor="searchTermClients"
                className="text-xs text-slate-400"
              >
                Search by Name, Email, or Phone
              </Label>
              <Input
                id="searchTermClients"
                type="text"
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            {/* Add other filters here if needed e.g. Verified Status */}
            {/* <div>
                <Label htmlFor="verifiedFilterClients" className="text-xs text-slate-400">Email Verified</Label>
                <Select value={verifiedFilter} onValueChange={(val) => setVerifiedFilter(val as any)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white mt-1"><SelectValue placeholder="Any Status" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="" className="focus:bg-slate-700">Any</SelectItem>
                        <SelectItem value="true" className="focus:bg-slate-700">Verified</SelectItem>
                        <SelectItem value="false" className="focus:bg-slate-700">Not Verified</SelectItem>
                    </SelectContent>
                </Select>
            </div> */}
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto"
              disabled={isLoading}
            >
              {isLoading && searchTerm ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search size={16} className="mr-2" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && clients.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      )}

      {!isLoading && clients.length === 0 && !error && (
        <Card className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700 mt-6">
          <CardContent>
            <UsersIcon size={48} className="mx-auto mb-4 text-slate-500" />
            <p className="text-lg font-semibold text-slate-300">
              No Client Accounts Found
            </p>
            <p>
              No clients match your current criteria, or no client accounts
              exist yet.
            </p>
          </CardContent>
        </Card>
      )}

      {clients.length > 0 && !isLoading && (
        <div className="overflow-x-auto bg-slate-800/60 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 mt-6">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/40 divide-y divide-slate-700/50">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-700/30 transition-colors duration-150"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {client.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {client.phone || "N/A"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {client.isEmailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditClientModal(client.id)}
                      className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-700/20"
                      title="Edit Client"
                    >
                      <EditIcon size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-700/20"
                      title="Delete Client"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && totalClients > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p className="text-xs">
            Showing {clients.length > 0 ? (currentPage - 1) * 10 + 1 : 0} -{" "}
            {Math.min(currentPage * 10, totalClients)} of {totalClients} clients
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

      {isClientModalOpen && (
        <UserFormModal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onUserSaved={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
            handleClientSaved();
          }}
          editingUser={editingClient}
          // You might need to pass a prop to UserFormModal to specify it's an AGENT managing a CLIENT
          // and to use the /api/agent/manage-clients endpoints.
          // For example: apiBasePath="/api/agent/manage-clients"
          // And ensure UserFormModal can handle role being fixed to CLIENT.
          enforcedRole={Role.CLIENT} // Add this prop to UserFormModal
        />
      )}
    </div>
  );
};

export default AgentClientsManagementPage;
