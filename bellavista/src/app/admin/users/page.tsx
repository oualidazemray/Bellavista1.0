// src/app/admin/users/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // Keep if used for other navigation, not strictly needed for modal
import {
  User, // Lucide User icon
  // Edit, // UserCog is used for edit button
  Trash2,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  UserCog, // For edit user button
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Role } from "@prisma/client";
import toast from "react-hot-toast";
// Ensure this path is correct to your UserFormModal component
import UserFormModal, { EditableUserData } from "./UserFormModal";

// Interface for user data displayed in the table
interface UserDataForTable {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string; // ISO string from API
  phone?: string | null;
}

interface FetchUsersResponse {
  users: UserDataForTable[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

const UserManagementPage = () => {
  const router = useRouter(); // Keep if needed for other future navigation
  const [users, setUsers] = useState<UserDataForTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const limit = 10;

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditableUserData | null>(null);

  const fetchUsers = useCallback(
    async (page: number, search: string, role: Role | "") => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) queryParams.set("search", search);
        if (role) queryParams.set("role", role);

        const response = await fetch(
          `/api/admin/users?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch users" }));
          throw new Error(errData.message || "Failed to fetch users");
        }
        const data: FetchUsersResponse = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalUsers(data.totalUsers);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message || "Could not load user data.");
        toast.error(err.message || "Could not load user data.");
      } finally {
        setIsLoading(false);
      }
    },
    [] // limit is constant, so no dependencies needed if not changing
  );

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, roleFilter);
  }, [currentPage, searchTerm, roleFilter, fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as Role | "");
    setCurrentPage(1);
  };

  const openCreateUserModal = () => {
    setEditingUser(null); // Ensure modal is in "create" mode
    setIsUserModalOpen(true);
  };

  const openEditUserModal = async (userIdToEdit: string) => {
    toast.loading("Fetching user details...", { id: "fetch-user-edit" });
    try {
      const response = await fetch(`/api/admin/users/${userIdToEdit}`); // GET specific user
      if (!response.ok) {
        const errData = await response.json().catch(() => ({
          message: `User details not found for ID: ${userIdToEdit}`,
        }));
        throw new Error(errData.message || "User details not found");
      }
      const userData: EditableUserData = await response.json(); // API returns data matching EditableUserData
      setEditingUser(userData);
      setIsUserModalOpen(true);
      toast.dismiss("fetch-user-edit");
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch user details for editing.", {
        id: "fetch-user-edit",
      });
      console.error("Error fetching user for edit:", err);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}" (ID: ${userId})? This action cannot be undone.`
      )
    ) {
      return;
    }
    const toastId = toast.loading(`Deleting user ${userName}...`);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete user.");
      }
      toast.success(
        result.message || `User ${userName} deleted successfully.`,
        { id: toastId }
      );
      fetchUsers(currentPage, searchTerm, roleFilter); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Error deleting user.", { id: toastId });
      console.error("Error deleting user:", err);
    }
  };

  const handleUserSaved = () => {
    fetchUsers(currentPage, searchTerm, roleFilter); // Refresh the user list after create or edit
  };

  if (isLoading && users.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {" "}
        {/* Adjusted height */}
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <span className="ml-3 text-xl text-slate-300">Loading Users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {" "}
      {/* Added small padding to main container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          User Management
        </h1>
        <button
          onClick={openCreateUserModal} // Call function to open modal
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <PlusCircle size={18} /> Add New User
        </button>
      </div>
      {/* Filters and Search */}
      <div className="p-4 bg-slate-800/70 backdrop-blur-sm rounded-lg shadow border border-slate-700 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 appearance-none"
          >
            <option value="">All Roles</option>
            {Object.values(Role).map((roleValue) => (
              <option key={roleValue} value={roleValue}>
                {roleValue.charAt(0) + roleValue.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && !isLoading && (
        <div className="p-4 bg-red-800/30 text-red-300 rounded-md text-center border border-red-600/50">
          <AlertTriangle className="inline w-5 h-5 mr-2" /> {error}
        </div>
      )}
      {/* User Table */}
      <div className="overflow-x-auto bg-slate-800/70 backdrop-blur-sm rounded-lg shadow border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-700/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Verified
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Joined
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
            {!isLoading &&
              users.length > 0 &&
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          user.role === Role.ADMIN
                            ? "bg-purple-200 text-purple-800"
                            : user.role === Role.AGENT
                            ? "bg-blue-200 text-blue-800"
                            : "bg-green-200 text-green-800"
                        }`}
                    >
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {user.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {" "}
                    {/* Centered icon */}
                    {user.isEmailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditUserModal(user.id)} // Correctly call openEditUserModal
                      title="Edit User"
                      className="text-purple-400 hover:text-purple-300 p-1.5 hover:bg-purple-700/20 rounded-md transition-colors"
                    >
                      <UserCog size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      title="Delete User"
                      className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-700/20 rounded-md transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!isLoading && users.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 mt-4 bg-slate-800/50 rounded-lg">
          No users found matching your criteria.
        </div>
      )}
      {isLoading && users.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}
      {/* Pagination Controls */}
      {!isLoading && totalUsers > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-300 gap-2">
          <p>
            Showing {users.length} of {totalUsers} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {/* User Form Modal (for both Create and Edit) */}
      {isUserModalOpen && ( // Conditionally render the modal for performance
        <UserFormModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
          }}
          onUserSaved={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
            handleUserSaved(); // This will call fetchUsers
          }}
          editingUser={editingUser}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
