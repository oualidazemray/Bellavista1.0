// src/components/ui/client/EditProfile.tsx
"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import {
  UserCircle2,
  Mail,
  BookText,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

// Define a type for the profile data
interface ProfileData {
  fullName: string;
  email: string;
  bio: string;
  profileImageUrl?: string | null;
}

// Initial/mock user data
const initialUserData: ProfileData = {
  fullName: "Alex Johnson",
  email: "alex.johnson@example.com",
  bio: "Passionate traveler and photographer. Exploring the world one click at a time. Loves sunny beaches and mountain hikes.",
  profileImageUrl: "/profile-placeholder.png",
};

const EditProfile: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData>(initialUserData);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "currentPassword") setCurrentPassword(value);
    if (name === "newPassword") setNewPassword(value);
    if (name === "confirmNewPassword") setConfirmNewPassword(value);
    setError(null);
    setSuccessMessage(null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (newPassword && newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setIsLoading(false);
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Current password is required to set a new password.");
      setIsLoading(false);
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API

    console.log("Profile Data to save:", profileData);
    if (selectedFile) {
      console.log("Image to upload:", selectedFile.name);
      setProfileData((prev) => ({ ...prev, profileImageUrl: imagePreview }));
      setImagePreview(null);
      setSelectedFile(null);
    }
    if (newPassword && currentPassword) {
      console.log("Password change attempt");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setSuccessMessage("Profile updated successfully!");
    setIsLoading(false);
  };

  const InputField: React.FC<{
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    icon: React.ReactNode;
    placeholder?: string;
    isPassword?: boolean;
    showPassword?: boolean;
    toggleShowPassword?: () => void;
    disabled?: boolean;
    required?: boolean;
    className?: string; // Added className prop
  }> = ({
    id,
    name,
    label,
    value,
    onChange,
    type = "text",
    icon,
    placeholder,
    isPassword,
    showPassword,
    toggleShowPassword,
    disabled,
    required,
    className = "",
  }) => (
    <div className={`mb-6 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-amber-300 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          required={required}
          className={`w-full pl-10 pr-10 py-3 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-200 text-white placeholder-gray-500 ${
            disabled ? "opacity-70 cursor-not-allowed" : ""
          }`}
        />
        {isPassword && toggleShowPassword && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <Image
          src="/beachBack.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-[#18130f]/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-amber-700/20 overflow-hidden border border-amber-500/30">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-400/30">
              <UserCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Edit Profile
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-300 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="md:flex md:space-x-8">
              {" "}
              {/* Main horizontal layout for medium screens and up */}
              {/* Left Pane: Profile Image */}
              <div className="md:w-1/3 flex flex-col items-center mb-8 md:mb-0">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-amber-400/50 shadow-lg mb-4">
                  <Image
                    src={
                      imagePreview ||
                      profileData.profileImageUrl ||
                      "/profile-placeholder.png"
                    }
                    alt="Profile"
                    layout="fill"
                    objectFit="cover"
                    className={
                      imagePreview || profileData.profileImageUrl
                        ? ""
                        : "opacity-50"
                    }
                  />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 transition-all duration-200 disabled:opacity-50"
                >
                  <Camera size={18} /> Change Photo
                </button>
              </div>
              {/* Right Pane: Form Fields */}
              <div className="md:w-2/3 space-y-6">
                {" "}
                {/* Removed top-level space-y-6 from form and put it here */}
                <InputField
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  icon={<UserCircle2 size={20} />}
                  placeholder="Enter your full name"
                  required
                />
                <InputField
                  id="email"
                  name="email"
                  label="Email Address"
                  value={profileData.email}
                  onChange={handleInputChange}
                  icon={<Mail size={20} />}
                  placeholder="your.email@example.com"
                  disabled
                />
                <p className="-mt-4 mb-4 text-xs text-gray-400 pl-1">
                  Email address cannot be changed here. Contact support.
                </p>
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-amber-300 mb-1"
                  >
                    Bio / About Me
                  </label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <BookText size={20} />
                    </div>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="Tell us something about yourself..."
                      className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-200 text-white placeholder-gray-500 resize-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Section - Full width below the two columns */}
            <div className="pt-6 mt-6 md:mt-8 border-t border-gray-700/50">
              <h2 className="text-lg font-semibold text-amber-400 mb-4">
                Change Password (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-6">
                {" "}
                {/* Using grid for password fields */}
                <InputField
                  id="currentPassword"
                  name="currentPassword"
                  label="Current Password"
                  value={currentPassword}
                  onChange={handlePasswordChange}
                  icon={<Lock size={20} />}
                  placeholder="Current password"
                  isPassword
                  showPassword={showCurrentPassword}
                  toggleShowPassword={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  className="md:col-span-1" // Ensure each field takes its column
                />
                <InputField
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  icon={<Lock size={20} />}
                  placeholder="New password (min. 6 chars)"
                  isPassword
                  showPassword={showNewPassword}
                  toggleShowPassword={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  className="md:col-span-1"
                />
                <InputField
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={handlePasswordChange}
                  icon={<Lock size={20} />}
                  placeholder="Confirm new password"
                  isPassword
                  showPassword={showConfirmNewPassword}
                  toggleShowPassword={() =>
                    setShowConfirmNewPassword(!showConfirmNewPassword)
                  }
                  className="md:col-span-1"
                />
              </div>
            </div>

            <div className="pt-6 mt-6 md:mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
