// src/components/ui/admin/UserFormModal.tsx (or a new AgentClientFormModal.tsx)
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  X,
  UserPlus,
  Edit3 as EditIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Role, User as PrismaUser } from "@prisma/client";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EditableUserData {
  // Data for pre-filling edit form
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  isEmailVerified: boolean;
  taxId?: string | null; // From ClientProfile
  bio?: string | null; // From User model
  profileImageUrl?: string | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: () => void;
  editingUser?: EditableUserData | null;
  // New prop to specify the context (admin managing any role, or agent managing CLIENTs)
  managementContext?: "admin" | "agent";
  enforcedRole?: Role; // If a specific role must be created/edited
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onUserSaved,
  editingUser,
  managementContext = "admin", // Default to admin context
  enforcedRole, // If agent is creating, this would be Role.CLIENT
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>(enforcedRole || Role.CLIENT); // Default based on prop or CLIENT
  const [phone, setPhone] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  // Add state for other fields if they are part of this generic modal (e.g., taxId, bio)
  const [taxId, setTaxId] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingUser?.id;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingUser) {
        setName(editingUser.name || "");
        setEmail(editingUser.email || "");
        setRole(editingUser.role || enforcedRole || Role.CLIENT); // Use editing user's role, or enforced, or default
        setPhone(editingUser.phone || "");
        setIsEmailVerified(editingUser.isEmailVerified || false);
        setTaxId(editingUser.taxId || "");
        setBio(editingUser.bio || "");
        setProfileImageUrl(editingUser.profileImageUrl || "");
        setPassword(""); // Clear password fields for edit mode
        setConfirmPassword("");
      } else {
        // Create mode
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole(enforcedRole || Role.CLIENT); // Enforce role if provided, else default
        setPhone("");
        setIsEmailVerified(false); // Default for new users by agent
        setTaxId("");
        setBio("");
        setProfileImageUrl("");
      }
      setError(null);
    }
  }, [isOpen, editingUser, isEditMode, enforcedRole]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !role) {
      toast.error("Name, email, and role are required.");
      return;
    }
    if (!isEditMode && (!password || password.length < 6)) {
      toast.error("Password (min 6 chars) required for new users.");
      return;
    }
    if (!isEditMode && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (isEditMode && password && password.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (isEditMode && password && password !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditMode ? "Updating user..." : "Creating user..."
    );

    const payload: any = {
      name,
      email,
      role,
      phone,
      isEmailVerified,
      taxId,
      bio,
      profileImageUrl,
    };
    if (!isEditMode || (isEditMode && password)) {
      // Only include password if creating or if actively changing in edit mode
      payload.password = password;
    }

    // Determine API path based on context
    const basePath = "/api/agent/manage-clients";
    const url = isEditMode ? `${basePath}/${editingUser?.id}` : basePath;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message ||
            `Failed to ${isEditMode ? "update" : "create"} user.`
        );
      toast.success(
        result.message ||
          `User ${isEditMode ? "updated" : "created"} successfully!`,
        { id: toastId }
      );
      onUserSaved();
      handleClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Resetting is handled by useEffect on isOpen change to create mode
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const canAgentEditRole = managementContext === "admin"; // Agent cannot change role, admin can

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-100">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 transform transition-all duration-300 ease-in-out scale-100 opacity-100">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-300 flex items-center gap-2">
            {isEditMode ? <EditIcon size={24} /> : <UserPlus size={24} />}
            {isEditMode ? "Edit Client Account" : "Create New Client Account"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            {" "}
            <X size={22} />{" "}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-700/30 border border-red-500 text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
        >
          <div>
            <Label
              htmlFor="name_modal"
              className="text-sm font-medium text-slate-300 mb-1"
            >
              Full Name
            </Label>
            <Input
              type="text"
              id="name_modal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>
          <div>
            <Label
              htmlFor="email_modal"
              className="text-sm font-medium text-slate-300 mb-1"
            >
              Email Address
            </Label>
            <Input
              type="email"
              id="email_modal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>

          {(isEditMode && (
            <p className="text-xs text-slate-400 -mb-2">
              Leave passwords blank to keep current.
            </p>
          )) ||
            (!isEditMode && (
              <p className="text-xs text-slate-400 -mb-2">
                Password required for new users.
              </p>
            ))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="password_modal"
                className="text-sm text-slate-300 mb-1"
              >
                {isEditMode ? "New Password" : "Password"}
              </Label>
              <Input
                type="password"
                id="password_modal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEditMode}
                minLength={
                  isEditMode && password ? 6 : isEditMode ? undefined : 6
                }
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
            <div>
              <Label
                htmlFor="confirmPassword_modal"
                className="text-sm text-slate-300 mb-1"
              >
                {isEditMode ? "Confirm New Password" : "Confirm Password"}
              </Label>
              <Input
                type="password"
                id="confirmPassword_modal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isEditMode || (isEditMode && password !== "")}
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="role_modal"
                className="text-sm font-medium text-slate-300 mb-1"
              >
                Role
              </Label>
              <Select
                id="role_modal"
                value={role}
                onValueChange={(value) => setRole(value as Role)}
                required
                disabled={
                  (!canAgentEditRole && isEditMode) ||
                  (managementContext === "agent" && !isEditMode)
                }
              >
                <SelectTrigger className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md text-white disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {managementContext === "agent" ||
                  enforcedRole === Role.CLIENT ? (
                    <SelectItem
                      value={Role.CLIENT}
                      className="focus:bg-slate-700"
                    >
                      Client
                    </SelectItem>
                  ) : (
                    Object.values(Role).map((roleValue) => (
                      <SelectItem
                        key={roleValue}
                        value={roleValue}
                        className="focus:bg-slate-700"
                      >
                        {roleValue.charAt(0) + roleValue.slice(1).toLowerCase()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="phone_modal"
                className="text-sm font-medium text-slate-300 mb-1"
              >
                Phone (Optional)
              </Label>
              <Input
                type="tel"
                id="phone_modal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
          </div>
          {/* Additional Fields from EditableUserData (bio, taxId, profileImageUrl) */}
          {/* These can be added here if agents should manage them */}
          <div>
            <Label
              htmlFor="bio_modal"
              className="text-sm font-medium text-slate-300 mb-1"
            >
              Bio (Optional)
            </Label>
            <Textarea
              id="bio_modal"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md resize-none"
            />
          </div>

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isEmailVerified_modal"
              checked={isEmailVerified}
              onChange={(e) => setIsEmailVerified(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-slate-500 rounded focus:ring-purple-500 accent-purple-500"
            />
            <label
              htmlFor="isEmailVerified_modal"
              className="ml-2 block text-sm text-slate-300"
            >
              Mark email as verified?
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
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
                : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
