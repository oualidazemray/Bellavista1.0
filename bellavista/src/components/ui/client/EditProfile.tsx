// src/components/ui/client/EditProfile.tsx
"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  useEffect,
} from "react";
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
  Edit3 as EditIcon,
  XCircle, // For Edit and Cancel
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ProfileDataFromAPI {
  fullName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
  taxId: string;
  bio: string;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  profileImageUrl?: string | null;
  taxId: string;
}

const EditProfile: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false); // Controls view/edit state
  const [profileData, setProfileData] = useState<ProfileFormState>({
    // Renamed from profileForm for clarity
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    profileImageUrl: null,
    taxId: "",
  });
  const [initialProfileData, setInitialProfileData] =
    useState<ProfileFormState | null>(null); // To revert on cancel

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // For direct file upload

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- InputField Component Definition ---
  const InputField: React.FC<{
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    icon?: React.ReactNode;
    placeholder?: string;
    isPassword?: boolean;
    showPassword?: boolean;
    toggleShowPassword?: () => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    readOnly?: boolean;
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
    readOnly = false,
  }) => (
    <div className={`mb-6 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-amber-300 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled || isSubmitting || isFetchingProfile}
          required={required}
          readOnly={readOnly} // Added readOnly prop
          className={`w-full ${icon ? "pl-10" : "pl-4"} ${
            isPassword ? "pr-10" : "pr-4"
          } py-3 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-200 text-white placeholder-gray-500 
            ${
              disabled || isSubmitting || isFetchingProfile || readOnly
                ? "opacity-70 cursor-not-allowed bg-gray-700/40"
                : ""
            }
            ${
              readOnly && !isPassword
                ? "focus:ring-0 focus:border-gray-600"
                : ""
            } // Less focus effect for readOnly non-password fields
          `}
        />
        {isPassword &&
          toggleShowPassword &&
          !readOnly && ( // Only show toggle if not readOnly
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
      </div>
    </div>
  );

  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetchingProfile(true);
      try {
        const response = await fetch("/api/client/profile");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch profile");
        }
        const data: ProfileDataFromAPI = await response.json();
        const formData = {
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          profileImageUrl: data.profileImageUrl,
          taxId: data.taxId || "",
        };
        setProfileData(formData);
        setInitialProfileData(formData); // Store initial data for cancel
      } catch (err: any) {
        toast.error(err.message || "Could not load profile data.");
      } finally {
        setIsFetchingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "currentPassword") setCurrentPassword(value);
    if (name === "newPassword") setNewPassword(value);
    if (name === "confirmNewPassword") setConfirmNewPassword(value);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
      // setSelectedFile(e.target.files[0]); // If direct upload
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleEditToggle = () => {
    if (isEditMode && initialProfileData) {
      // If cancelling edit
      setProfileData(initialProfileData); // Revert to initial data
      setImagePreview(null); // Clear image preview
      // Clear password fields too if you want
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setIsEditMode(!isEditMode);
  };

  // Place this function inside your EditProfile React component:
  // const EditProfile: React.FC = () => {
  //   ... (your existing states: profileData, currentPassword, newPassword, etc.) ...

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Use isSubmitting instead of isLoading for clarity if you have isFetchingProfile
    toast.dismiss(); // Dismiss any existing toasts

    let profileUpdateSuccess = false;
    let passwordChangeSuccess = false;
    let passwordChangeAttempted = false;

    // --- Prepare Profile Data to Update ---
    // Only send fields that can actually be updated by the user.
    // Email is typically not updatable here.
    const profilePayload: {
      fullName?: string;
      phone?: string;
      bio?: string;
      taxId?: string;
      profileImageUrl?: string | null; // Only if you handle image uploads/URL changes
    } = {
      fullName: profileData.fullName,
      phone: profileData.phone,
      bio: profileData.bio,
      taxId: profileData.taxId,
    };

    // Handle profileImageUrl:
    // This logic needs to align with your image upload strategy.
    // If imagePreview is a new base64/file to upload, this API call needs to be FormData.
    // If imagePreview is a URL obtained after uploading elsewhere, then this is fine.
    // If profileData.profileImageUrl can be cleared by setting to empty string or null from form.
    if (imagePreview) {
      // A new image was selected and previewed
      // SCENARIO 1: You've uploaded imagePreview (as a file) and got a new URL
      // profilePayload.profileImageUrl = newUrlFromServerAfterUpload;

      // SCENARIO 2: You are sending the base64 data of imagePreview (not recommended for large images)
      // profilePayload.profileImageUrl = imagePreview; // Backend must handle base64

      // SCENARIO 3: For this example, we assume imagePreview is NOT directly sent.
      // Actual image upload should be a separate step or handled differently.
      // If you mean to update the URL if it was typed/pasted by user:
      // No, this component doesn't have a field for typing profileImageUrl.
      // This section needs a clear image upload strategy.
      // For now, we'll only update profileImageUrl if it was explicitly changed
      // via a mechanism not shown (e.g., separate upload button that sets profileData.profileImageUrl)
      // OR if you are clearing it.
      console.warn(
        "Image preview is set, but direct image upload logic is not fully implemented in this handleSubmit example. Sending current profileData.profileImageUrl or null."
      );
      if (profileData.profileImageUrl !== initialProfileData?.profileImageUrl) {
        profilePayload.profileImageUrl = profileData.profileImageUrl; // If it was changed or cleared
      }
    } else if (
      profileData.profileImageUrl !== initialProfileData?.profileImageUrl
    ) {
      // If imagePreview is null, but the profileImageUrl in form state differs from initial (e.g., user cleared it)
      profilePayload.profileImageUrl = profileData.profileImageUrl;
    }
    // If no new image preview and URL hasn't changed from initial, don't send profileImageUrl to avoid overwriting with null if not intended.
    // However, for simplicity in this example, if it's in profileData, we might send it.
    // A better approach is to only send fields that have actually changed.
    // For now, if profileImageUrl is part of profileData, and differs from initial, we assume it's intended.

    // --- 1. Update Profile Information (excluding password) ---
    try {
      console.log("Attempting to update profile with payload:", profilePayload);
      const profileResponse = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!profileResponse.ok) {
        let errorMsg = "Failed to update profile.";
        try {
          if (
            profileResponse.headers
              .get("content-type")
              ?.includes("application/json")
          ) {
            const errorResult = await profileResponse.json();
            errorMsg = errorResult.message || errorMsg;
          } else {
            const textError = await profileResponse.text();
            errorMsg = textError || errorMsg; // Use text if not JSON or parsing fails
          }
        } catch (e) {
          console.error(
            "Failed to parse error response from profile update:",
            e
          );
        }
        throw new Error(errorMsg);
      }

      const profileResult = await profileResponse.json(); // Expect { message: string, profile: ProfileDataFromAPI }
      console.log("Profile update successful:", profileResult);

      // Update local state with potentially sanitized/updated data from backend
      const updatedDataFromApi = profileResult.profile;
      setProfileData({
        fullName: updatedDataFromApi.fullName || "",
        email: profileData.email, // Email is not updated by this endpoint
        phone: updatedDataFromApi.phone || "",
        bio: updatedDataFromApi.bio || "",
        taxId: updatedDataFromApi.taxId || "",
        profileImageUrl: updatedDataFromApi.profileImageUrl || null,
      });
      setInitialProfileData({
        // Update initial data to match the saved state
        fullName: updatedDataFromApi.fullName || "",
        email: profileData.email,
        phone: updatedDataFromApi.phone || "",
        bio: updatedDataFromApi.bio || "",
        taxId: updatedDataFromApi.taxId || "",
        profileImageUrl: updatedDataFromApi.profileImageUrl || null,
      });
      setImagePreview(null); // Clear image preview if a new one was set
      profileUpdateSuccess = true;
    } catch (err: any) {
      console.error("Error during profile update fetch:", err);
      toast.error(
        err.message || "An unexpected error occurred during profile update."
      );
      profileUpdateSuccess = false; // Explicitly set on error
    }

    // --- 2. Handle Password Change (only if attempted) ---
    if (newPassword || currentPassword) {
      // Check if user intends to change password
      passwordChangeAttempted = true;
      if (newPassword && newPassword !== confirmNewPassword) {
        toast.error("New passwords do not match.");
      } else if (newPassword && !currentPassword) {
        toast.error("Current password is required to set a new password.");
      } else if (newPassword && newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
      } else if (currentPassword && newPassword && confirmNewPassword) {
        // All conditions met to attempt API call
        try {
          console.log("Attempting to change password...");
          const passwordResponse = await fetch(
            "/api/client/profile/change-password",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentPassword, newPassword }),
            }
          );

          if (!passwordResponse.ok) {
            let errorMsg = "Password change failed.";
            try {
              if (
                passwordResponse.headers
                  .get("content-type")
                  ?.includes("application/json")
              ) {
                const errorResult = await passwordResponse.json();
                errorMsg = errorResult.message || errorMsg;
              } else {
                const textError = await passwordResponse.text();
                errorMsg = textError || errorMsg;
              }
            } catch (e) {
              console.error(
                "Failed to parse error response from password change:",
                e
              );
            }
            throw new Error(errorMsg);
          }

          const passwordResult = await passwordResponse.json(); // Expect { message: string }
          console.log("Password change successful:", passwordResult);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          passwordChangeSuccess = true;
          // Toast for password success can be combined or separate
          // toast.success(passwordResult.message || "Password changed successfully!");
        } catch (err: any) {
          console.error("Error during password change fetch:", err);
          toast.error(
            err.message ||
              "An unexpected error occurred during password change."
          );
          passwordChangeSuccess = false; // Explicitly set on error
        }
      } else if (currentPassword && !newPassword && !confirmNewPassword) {
        // User only typed in current password, not necessarily an error, just no action taken
        console.log(
          "Password change not fully attempted: new password or confirmation missing."
        );
        passwordChangeAttempted = false; // Not a full attempt if new password isn't there
      }
    }

    setIsSubmitting(false);

    // --- Final Toast Notifications based on outcomes ---
    if (profileUpdateSuccess && !passwordChangeAttempted) {
      toast.success("Profile updated successfully!");
      setIsEditMode(false); // Exit edit mode on success
    } else if (
      profileUpdateSuccess &&
      passwordChangeAttempted &&
      passwordChangeSuccess
    ) {
      toast.success("Profile and password updated successfully!");
      setIsEditMode(false); // Exit edit mode on full success
    } else if (
      profileUpdateSuccess &&
      passwordChangeAttempted &&
      !passwordChangeSuccess
    ) {
      // Profile updated, but password change had an issue (error already toasted for password)
      toast.success(
        "Profile data updated. Password change failed (see previous error)."
      );
      // Optionally keep in edit mode for password correction:
      // setIsEditMode(true);
    } else if (
      !profileUpdateSuccess &&
      passwordChangeAttempted &&
      passwordChangeSuccess
    ) {
      // Profile update failed (error already toasted), but password changed. This is an odd state.
      toast.success(
        "Password changed successfully, but profile data update failed (see previous error)."
      );
    }
    // If both failed, individual error toasts should have appeared.
  };

  //   ... (rest of your EditProfile component: InputField, useEffect for fetch, return JSX) ...
  // }; // End of EditProfile component

  if (isFetchingProfile) {
    /* ... loading UI ... */
  }

  return (
    <div className="relative z-10 w-full max-w-4xl bg-[#18130f]/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-amber-700/20 overflow-hidden border border-amber-500/30">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          {" "}
          {/* Added justify-between */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-400/30">
              <UserCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {isEditMode ? "Edit Profile" : "View Profile"}
            </h1>
          </div>
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500/80 hover:bg-amber-600/80 text-black font-semibold transition-all duration-200 disabled:opacity-50"
            disabled={isSubmitting || isFetchingProfile}
          >
            {isEditMode ? <XCircle size={18} /> : <EditIcon size={18} />}
            {isEditMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="md:flex md:space-x-8">
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
                  onError={() => {
                    setProfileData((prev) => ({
                      ...prev,
                      profileImageUrl: "/profile-placeholder.png",
                    }));
                    setImagePreview(null);
                  }}
                />
              </div>
              {isEditMode && ( // Only show "Change Photo" in edit mode
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-700/50 hover:bg-gray-600/70 text-amber-300"
                  >
                    <Camera size={18} /> Change Photo
                  </button>
                </>
              )}
            </div>

            <div className="md:w-2/3 space-y-0">
              <InputField
                id="fullName"
                name="fullName"
                label="Full Name"
                value={profileData.fullName}
                onChange={(e) =>
                  handleInputChange(e as ChangeEvent<HTMLInputElement>)
                }
                icon={<UserCircle2 size={20} />}
                placeholder="Enter your full name"
                required
                readOnly={!isEditMode}
              />
              <InputField
                id="phone"
                name="phone"
                label="Phone Number"
                value={profileData.phone}
                onChange={(e) =>
                  handleInputChange(e as ChangeEvent<HTMLInputElement>)
                }
                icon={<UserCircle2 size={20} />}
                placeholder="Enter your phone number"
                readOnly={!isEditMode}
              />
              <InputField
                id="email"
                name="email"
                label="Email Address"
                value={profileData.email}
                onChange={() => {}}
                icon={<Mail size={20} />}
                placeholder="your.email@example.com"
                disabled
                readOnly /* Email always readonly */
              />
              <p className="-mt-5 mb-6 text-xs text-gray-400 pl-1">
                Email address cannot be changed.
              </p>

              <div className="mb-6">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-amber-300 mb-1"
                >
                  Bio / About Me
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={isSubmitting || !isEditMode}
                  readOnly={!isEditMode}
                  placeholder="Tell us something about yourself..."
                  className={`w-full pl-4 pr-3 py-3 rounded-lg bg-gray-700/60 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-white placeholder-gray-500 resize-none scrollbar-thin 
                    ${
                      !isEditMode
                        ? "opacity-70 cursor-not-allowed bg-gray-700/40 focus:ring-0 focus:border-gray-600"
                        : ""
                    }`}
                />
              </div>
              <InputField
                id="taxId"
                name="taxId"
                label="Tax ID (Optional)"
                value={profileData.taxId}
                onChange={(e) =>
                  handleInputChange(e as ChangeEvent<HTMLInputElement>)
                }
                placeholder="Enter your Tax ID"
                className="mb-0"
                readOnly={!isEditMode}
              />
            </div>
          </div>

          {isEditMode && ( // Only show password change and save button in edit mode
            <>
              <div className="pt-6 mt-6 md:mt-8 border-t border-gray-700/50">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">
                  Change Password (Optional)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-6">
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
                    className="md:col-span-1"
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
                  disabled={isSubmitting || isFetchingProfile}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold"
                >
                  {isSubmitting ? (
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
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
