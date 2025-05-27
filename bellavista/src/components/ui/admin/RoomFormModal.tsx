// src/components/ui/admin/RoomFormModal.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  X,
  PlusCircle,
  Edit3 as EditIcon,
  CheckCircle,
  Loader2,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { RoomType, RoomView, Prisma } from "@prisma/client"; // Import Prisma types
import toast from "react-hot-toast";

// This interface should match all fields you want to create/edit for a Room
// It aligns with UpsertRoomRequestBody from your API
export interface UpsertRoomData {
  name: string;
  description?: string | null;
  roomNumber: string;
  type: RoomType;
  floor: number;
  pricePerNight: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  maxGuests: number;
  beds?: number | null;
  bedConfiguration?: string | null;
  view?: RoomView | null;
  characteristics?: string[];
  sqMeters?: number | null;
  featured?: boolean;
  rating?: number | null;
}

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSaved: () => void;
  editingRoomData?: (UpsertRoomData & { id?: string }) | null; // Includes ID if editing
}

// Example characteristics - in a real app, these might come from a config or DB
const ALL_CHARACTERISTICS = [
  "wifi",
  "ac",
  "balcony",
  "minibar",
  "tv",
  "pet-friendly",
  "kitchenette",
  "jacuzzi",
];

const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  onRoomSaved,
  editingRoomData,
}) => {
  const [formData, setFormData] = useState<UpsertRoomData>({
    name: "",
    description: "",
    roomNumber: "",
    type: RoomType.SIMPLE,
    floor: 0,
    pricePerNight: 0,
    maxGuests: 1,
    imageUrls: [],
    characteristics: [],
    featured: false,
    // Initialize other optional fields as needed
    beds: 1,
    bedConfiguration: "",
    view: null,
    sqMeters: 0,
    rating: null,
    imageUrl: null,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState(""); // For managing imageUrls array

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingRoomData?.id;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingRoomData) {
        setFormData({
          name: editingRoomData.name || "",
          description: editingRoomData.description || "",
          roomNumber: editingRoomData.roomNumber || "",
          type: editingRoomData.type || RoomType.SIMPLE,
          floor: editingRoomData.floor || 0,
          pricePerNight: editingRoomData.pricePerNight || 0,
          imageUrl: editingRoomData.imageUrl || null,
          imageUrls: editingRoomData.imageUrls || [],
          maxGuests: editingRoomData.maxGuests || 1,
          beds: editingRoomData.beds,
          bedConfiguration: editingRoomData.bedConfiguration,
          view: editingRoomData.view,
          characteristics: editingRoomData.characteristics || [],
          sqMeters: editingRoomData.sqMeters,
          featured: editingRoomData.featured || false,
          rating: editingRoomData.rating,
        });
      } else {
        // Reset for create mode
        setFormData({
          name: "",
          description: "",
          roomNumber: "",
          type: RoomType.SIMPLE,
          floor: 0,
          pricePerNight: 100,
          maxGuests: 2,
          imageUrls: [],
          characteristics: [],
          featured: false,
          beds: 1,
          bedConfiguration: "1 Double Bed",
          view: null,
          sqMeters: 20,
          rating: null,
          imageUrl: null,
        });
      }
      setError(null); // Clear errors when modal opens/changes mode
    }
  }, [isOpen, editingRoomData, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === "number") {
      processedValue = value === "" ? null : parseFloat(value); // Allow clearing number to null
      if (name === "floor" || name === "maxGuests" || name === "beds") {
        processedValue = value === "" ? null : parseInt(value, 10);
      }
    }
    if (type === "checkbox") {
      // For featured
      processedValue = (e.target as HTMLInputElement).checked;
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleCharacteristicsChange = (char: string) => {
    setFormData((prev) => {
      const newChars = prev.characteristics?.includes(char)
        ? prev.characteristics.filter((c) => c !== char)
        : [...(prev.characteristics || []), char];
      return { ...prev, characteristics: newChars };
    });
  };

  const handleAddImageUrl = () => {
    if (
      currentImageUrl.trim() &&
      !formData.imageUrls?.includes(currentImageUrl.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), currentImageUrl.trim()],
      }));
      setCurrentImageUrl("");
    }
  };
  const handleRemoveImageUrl = (urlToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((url) => url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (
      !formData.name ||
      !formData.roomNumber ||
      !formData.type ||
      formData.pricePerNight <= 0 ||
      formData.maxGuests < 1 ||
      formData.floor === null ||
      formData.floor < 0
    ) {
      const msg =
        "Name, Room Number, Type, Price, Max Guests, and Floor are required and must be valid.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditMode ? "Updating room..." : "Creating room..."
    );

    const payload = { ...formData };
    // Ensure empty strings for optional text fields become null for Prisma
    if (payload.description === "") payload.description = null;
    if (payload.bedConfiguration === "") payload.bedConfiguration = null;
    if (payload.imageUrl === "") payload.imageUrl = null;

    const url = isEditMode
      ? `/api/admin/rooms/${editingRoomData?.id}`
      : "/api/admin/rooms";
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
            `Failed to ${isEditMode ? "update" : "create"} room.`
        );
      toast.success(
        result.message || `Room ${isEditMode ? "updated" : "created"}!`,
        { id: toastId }
      );
      onRoomSaved();
      handleClose();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null); // Clear error on close
    // useEffect handles form reset based on isOpen and editingRoomData
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-700 shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-300 flex items-center gap-2">
            {isEditMode ? <EditIcon size={24} /> : <PlusCircle size={24} />}
            {isEditMode ? "Edit Room" : "Add New Room"}
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
          className="space-y-4 overflow-y-auto pr-2 flex-grow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm text-slate-300 mb-1"
              >
                Room Name/Title
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="roomNumber"
                className="block text-sm text-slate-300 mb-1"
              >
                Room Number
              </label>
              <input
                type="text"
                name="roomNumber"
                id="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                required
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm text-slate-300 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md resize-y"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block text-sm text-slate-300 mb-1"
              >
                Type
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md appearance-none"
              >
                {Object.values(RoomType).map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="floor"
                className="block text-sm text-slate-300 mb-1"
              >
                Floor
              </label>
              <input
                type="number"
                name="floor"
                id="floor"
                value={formData.floor ?? ""}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="pricePerNight"
                className="block text-sm text-slate-300 mb-1"
              >
                Price/Night (MAD)
              </label>
              <input
                type="number"
                name="pricePerNight"
                id="pricePerNight"
                value={formData.pricePerNight ?? ""}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="maxGuests"
                className="block text-sm text-slate-300 mb-1"
              >
                Max Guests
              </label>
              <input
                type="number"
                name="maxGuests"
                id="maxGuests"
                value={formData.maxGuests ?? ""}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="beds"
                className="block text-sm text-slate-300 mb-1"
              >
                Beds (Optional)
              </label>
              <input
                type="number"
                name="beds"
                id="beds"
                value={formData.beds ?? ""}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="view"
                className="block text-sm text-slate-300 mb-1"
              >
                View (Optional)
              </label>
              <select
                name="view"
                id="view"
                value={formData.view || ""}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md appearance-none"
              >
                <option value="">None</option>
                {Object.values(RoomView).map((rv) => (
                  <option key={rv} value={rv}>
                    {rv}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="bedConfiguration"
              className="block text-sm text-slate-300 mb-1"
            >
              Bed Configuration (e.g., 1 King, 2 Twin)
            </label>
            <input
              type="text"
              name="bedConfiguration"
              id="bedConfiguration"
              value={formData.bedConfiguration || ""}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="sqMeters"
              className="block text-sm text-slate-300 mb-1"
            >
              Area (sqM, Optional)
            </label>
            <input
              type="number"
              name="sqMeters"
              id="sqMeters"
              value={formData.sqMeters ?? ""}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="rating"
              className="block text-sm text-slate-300 mb-1"
            >
              Rating (0-5, Optional)
            </label>
            <input
              type="number"
              name="rating"
              id="rating"
              value={formData.rating ?? ""}
              onChange={handleInputChange}
              min="0"
              max="5"
              step="0.1"
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm text-slate-300 mb-1"
            >
              Main Image URL (Optional)
            </label>
            <input
              type="url"
              name="imageUrl"
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Additional Image URLs (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={currentImageUrl}
                onChange={(e) => setCurrentImageUrl(e.target.value)}
                placeholder="Add image URL"
                className="flex-grow p-2.5 bg-slate-700/50 border-slate-600 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="p-2.5 bg-purple-500/70 hover:bg-purple-600/70 text-white rounded-md"
              >
                <ImagePlus size={18} />
              </button>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {formData.imageUrls?.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs bg-slate-700 p-1.5 rounded"
                >
                  <span className="truncate w-full pr-2">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(url)}
                    className="text-red-400 hover:text-red-300 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Characteristics (Select multiple)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_CHARACTERISTICS.map((char) => (
                <label
                  key={char}
                  className="flex items-center gap-2 p-2 bg-slate-700/50 border border-slate-600 rounded-md text-xs cursor-pointer hover:border-purple-500"
                >
                  <input
                    type="checkbox"
                    checked={formData.characteristics?.includes(char) || false}
                    onChange={() => handleCharacteristicsChange(char)}
                    className="accent-purple-500"
                  />
                  {char.charAt(0).toUpperCase() + char.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center mt-1">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              checked={formData.featured || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-purple-600 border-slate-500 rounded accent-purple-500"
            />
            <label htmlFor="featured" className="ml-2 text-sm text-slate-300">
              Mark as Featured Room?
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditMode ? (
                <CheckCircle size={16} />
              ) : (
                <PlusCircle size={16} />
              )}
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Save Changes"
                : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
