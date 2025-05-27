// src/components/ui/admin/UserFormModal.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  X,
  UserPlus,
  Edit3 as EditIcon,
  CheckCircle,
  Loader2,
} from "lucide-react"; // Added EditIcon
import { Role, User as PrismaUser } from "@prisma/client"; // Import PrismaUser for editingUser type
import toast from "react-hot-toast";

// User data structure for editing (subset of PrismaUser, or what API returns for GET /api/admin/users/[id])
export interface EditableUserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  isEmailVerified: boolean;
  // Do not include password here for pre-filling
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: () => void; // Callback to refresh user list (for both create and edit)
  editingUser?: EditableUserData | null; // If provided, modal is in "edit" mode
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onUserSaved,
  editingUser,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Only for create mode or if changing password
  const [confirmPassword, setConfirmPassword] = useState(""); // Only for create mode
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [phone, setPhone] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingUser;

  useEffect(() => {
    if (isEditMode && editingUser) {
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setRole(editingUser.role || Role.CLIENT);
      setPhone(editingUser.phone || "");
      setIsEmailVerified(editingUser.isEmailVerified || false);
      // Password fields are typically not pre-filled for editing for security
      setPassword("");
      setConfirmPassword("");
    } else {
      // Reset for create mode
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole(Role.CLIENT);
      setPhone("");
      setIsEmailVerified(false);
    }
  }, [isOpen, editingUser, isEditMode]); // Reset form when modal opens or editingUser changes

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !role) {
      setError("Name, email, and role are required.");
      toast.error("Name, email, and role are required.");
      return;
    }
    if (!isEditMode && (!password || password.length < 6)) {
      // Password required for create
      setError("Password is required (min 6 chars) for new users.");
      toast.error("Password is required (min 6 chars) for new users.");
      return;
    }
    if (!isEditMode && password !== confirmPassword) {
      // Confirm password only for create
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }
    // Password validation if changing password in edit mode (optional for this form)
    if (isEditMode && password && password.length < 6) {
      setError("New password must be at least 6 characters.");
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (isEditMode && password && password !== confirmPassword) {
      setError("New passwords do not match.");
      toast.error("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditMode ? "Updating user..." : "Creating user..."
    );

    const payload: any = { name, email, role, phone, isEmailVerified };
    if (!isEditMode || password) {
      // Only include password if creating or if it's being changed in edit mode
      payload.password = password;
    }

    const url = isEditMode
      ? `/api/admin/users/${editingUser?.id}`
      : "/api/admin/users";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to ${isEditMode ? "update" : "create"} user.`
        );
      }

      toast.success(
        result.message ||
          `User ${isEditMode ? "updated" : "created"} successfully!`,
        { id: toastId }
      );
      onUserSaved();
      handleClose();
    } catch (err: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} user:`, err);
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    // Don't reset fields immediately if user might want to retry,
    // but useEffect on isOpen will reset if they close and reopen for "create".
    // For edit, if they cancel, parent might want to refetch or keep stale data.
    // For now, useEffect handles reset on open.
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-100">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 transform transition-all duration-300 ease-in-out scale-100 opacity-100">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-300 flex items-center gap-2">
            {isEditMode ? <EditIcon size={24} /> : <UserPlus size={24} />}
            {isEditMode ? "Edit User" : "Create New User"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-700/30 border border-red-500 text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto pr-2"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {/* Password fields are optional for editing, required for creating */}
          {(isEditMode && "Leave blank to keep current password") ||
          !isEditMode ? (
            <p className="text-xs text-slate-400 -mb-3">
              {isEditMode
                ? "Leave password fields blank to keep the current password."
                : "Password is required for new users."}
            </p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="password_form"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                {isEditMode ? "New Password" : "Password"}
              </label>
              <input
                type="password"
                id="password_form"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEditMode}
                minLength={
                  isEditMode && password ? 6 : isEditMode ? undefined : 6
                }
                className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword_form"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                {isEditMode ? "Confirm New Password" : "Confirm Password"}
              </label>
              <input
                type="password"
                id="confirmPassword_form"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isEditMode || (isEditMode && password !== "")} // Required if password is being changed
                className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                required
                className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 appearance-none"
              >
                {Object.values(Role).map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleValue.charAt(0) + roleValue.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEmailVerified_form"
              checked={isEmailVerified}
              onChange={(e) => setIsEmailVerified(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-slate-500 rounded focus:ring-purple-500 accent-purple-500"
            />
            <label
              htmlFor="isEmailVerified_form"
              className="ml-2 block text-sm text-slate-300"
            >
              Mark email as verified?
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditMode ? (
                <CheckCircle size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
