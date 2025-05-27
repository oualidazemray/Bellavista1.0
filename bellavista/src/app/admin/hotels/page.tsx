// src/app/admin/hotels/page.tsx (or /admin/rooms/page.tsx)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Loader2,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
  CheckCircle,
  UserCog,
  XCircle,
} from "lucide-react";
import { Role, RoomType, RoomView } from "@prisma/client"; // Import enums for filters
import toast from "react-hot-toast";
// Assuming UserFormModal is now RoomFormModal and handles room fields
import RoomFormModal, {
  UpsertRoomData,
} from "@/components/ui/admin/RoomFormModal";
// Interface for room data displayed in the table/list
interface RoomManagementItem {
  id: string;
  name: string;
  roomNumber: string;
  type: string; // String representation of RoomType
  floor: number;
  pricePerNight: number;
  maxGuests: number;
  view?: string | null; // String representation of RoomView
  featured: boolean;
  imageUrl?: string | null;
}

interface FetchRoomsAdminResponse {
  rooms: RoomManagementItem[]; // Should match the select in API GET /api/admin/rooms
  totalPages: number;
  currentPage: number;
  totalRooms: number;
}

const AdminHotelManagementPage = () => {
  const [rooms, setRooms] = useState<RoomManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<RoomType | "">("");
  const [viewFilter, setViewFilter] = useState<RoomView | "">("");
  const [featuredFilter, setFeaturedFilter] = useState<"" | "true" | "false">(
    ""
  );

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<
    (UpsertRoomData & { id?: string }) | null
  >(null); // For pre-filling edit form

  const fetchRooms = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10", // Or make limit configurable
        });
        if (searchTerm) queryParams.set("search", searchTerm);
        if (typeFilter) queryParams.set("type", typeFilter);
        if (viewFilter) queryParams.set("view", viewFilter);
        if (featuredFilter) queryParams.set("featured", featuredFilter);

        const response = await fetch(
          `/api/admin/rooms?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch rooms" }));
          throw new Error(errData.message);
        }
        const data: FetchRoomsAdminResponse = await response.json();
        // Map Prisma enum values to string keys for display if needed, or API already does it
        const mappedRooms = data.rooms.map((room) => ({
          ...room,
          type: RoomType[room.type as keyof typeof RoomType] || room.type, // Convert enum to string
          view: room.view
            ? RoomView[room.view as keyof typeof RoomView] || room.view
            : "N/A",
        }));
        setRooms(mappedRooms);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalRooms(data.totalRooms);
      } catch (err: any) {
        console.error("Error fetching rooms:", err);
        setError(err.message || "Could not load room data.");
        toast.error(err.message || "Could not load room data.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, typeFilter, viewFilter, featuredFilter]
  ); // Add all filter dependencies

  useEffect(() => {
    fetchRooms(currentPage);
  }, [currentPage, fetchRooms]); // fetchRooms is memoized by useCallback

  const handleAddNewRoom = () => {
    setEditingRoom(null); // Ensure it's in "create" mode
    setIsRoomModalOpen(true);
  };

  const handleEditRoom = async (roomId: string) => {
    toast.loading("Fetching room details...", { id: `fetch-room-${roomId}` });
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`);
      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ message: "Room not found" }));
        throw new Error(err.message);
      }
      const roomData: UpsertRoomData & { id: string } = await response.json(); // API should return full room data
      setEditingRoom(roomData);
      setIsRoomModalOpen(true);
      toast.dismiss(`fetch-room-${roomId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch room details.", {
        id: `fetch-room-${roomId}`,
      });
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete room "${roomName}" (ID: ${roomId})? This may affect past reservations if not handled carefully.`
      )
    ) {
      return;
    }
    const toastId = toast.loading(`Deleting room ${roomName}...`);
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete room.");
      }
      toast.success(
        result.message || `Room ${roomName} deleted successfully.`,
        { id: toastId }
      );
      fetchRooms(currentPage); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Error deleting room.", { id: toastId });
      console.error("Error deleting room:", err);
    }
  };

  const handleRoomSaved = () => {
    // Called after modal saves (create or edit)
    fetchRooms(currentPage);
  };

  if (isLoading && rooms.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />{" "}
        <span className="ml-2 text-slate-300">Loading Hotel Rooms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <HotelIcon size={30} className="text-purple-400" /> Hotel & Room
          Management
        </h1>
        <button
          onClick={handleAddNewRoom}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <PlusCircle size={18} /> Add New Room
        </button>
      </div>

      {/* Filters Section */}
      <div className="p-4 bg-slate-800/70 backdrop-blur-sm rounded-lg shadow border border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label
            htmlFor="searchTermRooms"
            className="text-xs text-slate-400 block mb-1"
          >
            Search Name/Number
          </label>
          <input
            id="searchTermRooms"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label
            htmlFor="typeFilterRooms"
            className="text-xs text-slate-400 block mb-1"
          >
            Room Type
          </label>
          <select
            id="typeFilterRooms"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RoomType | "")}
            className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 appearance-none"
          >
            <option value="">All Types</option>
            {Object.values(RoomType).map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="viewFilterRooms"
            className="text-xs text-slate-400 block mb-1"
          >
            View
          </label>
          <select
            id="viewFilterRooms"
            value={viewFilter}
            onChange={(e) => setViewFilter(e.target.value as RoomView | "")}
            className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 appearance-none"
          >
            <option value="">All Views</option>
            {Object.values(RoomView).map((rv) => (
              <option key={rv} value={rv}>
                {rv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="featuredFilterRooms"
            className="text-xs text-slate-400 block mb-1"
          >
            Featured
          </label>
          <select
            id="featuredFilterRooms"
            value={featuredFilter}
            onChange={(e) =>
              setFeaturedFilter(e.target.value as "" | "true" | "false")
            }
            className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 appearance-none"
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <button
          onClick={() => fetchRooms(1)}
          className="sm:col-span-full lg:col-span-1 mt-4 lg:mt-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FilterIcon size={16} /> Apply Filters
        </button>
      </div>

      {error && !isLoading && (
        <div className="p-4 bg-red-800/30 text-red-300 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Rooms Table */}
      <div className="overflow-x-auto bg-slate-800/70 backdrop-blur-sm rounded-lg shadow border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Room
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Price/Night
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Guests
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
            {!isLoading &&
              rooms.map((room) => (
                <tr
                  key={room.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-md object-cover mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center mr-3">
                          <HotelIcon size={20} className="text-slate-500" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-white">
                        {room.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {room.roomNumber}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {room.type}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    ${room.pricePerNight.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-center">
                    {room.maxGuests}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {room.featured ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditRoom(room.id)}
                      title="Edit Room"
                      className="text-purple-400 hover:text-purple-300 p-1.5 hover:bg-purple-700/20 rounded-md"
                    >
                      <UserCog size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      title="Delete Room"
                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-700/20 rounded-md"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && rooms.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 mt-4 bg-slate-800/50 rounded-lg">
          No rooms found matching your criteria.
        </div>
      )}
      {isLoading && rooms.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalRooms > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p>
            Showing {rooms.length} of {totalRooms} rooms
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Room Form Modal (for Create and Edit) */}
      {isRoomModalOpen && (
        <RoomFormModal
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setEditingRoom(null);
          }}
          onRoomSaved={() => {
            setIsRoomModalOpen(false);
            setEditingRoom(null);
            handleRoomSaved();
          }}
          editingRoomData={editingRoom} // Pass room data for editing, or null for create
        />
      )}
    </div>
  );
};

export default AdminHotelManagementPage;
