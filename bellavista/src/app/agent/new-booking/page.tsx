// src/app/agent/new-booking/page.tsx
"use client";

import React, { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarPlus,
  UserPlus,
  UserSearch,
  BedDouble,
  Users as GuestsIcon,
  User,
  UserCheck,
  Search as SearchIcon,
  SlidersHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Receipt,
  Hotel as HotelIcon,
  CalendarDays,
  AlertTriangle,
  Check,
  ArrowLeft,
  Mail,
  PhoneCall,
} from "lucide-react";
import toast from "react-hot-toast";

import AgentRoomCard from "@/components/ui/agent/AgentRoomCard";
import AgentRoomFilter, {
  AgentFilterState,
  initialAgentFilterStateValues,
} from "@/components/ui/agent/AgentRoomFilter";
import AgentBookingParamsSection, {
  AgentBookingParams,
} from "@/components/ui/agent/AgentBookingParamsSection";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User as ClientUserPrisma, Role } from "@prisma/client";

export interface RoomData {
  id: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  name: string;
  description?: string | null;
  price: number;
  beds?: number | null;
  bedType: string;
  guests: number;
  view?: string | null;
  characteristics?: string[];
  sqMeters?: number | null;
  rating?: number | null;
  featured?: boolean;
  currency?: string;
}
export interface AgentBookingItem {
  roomId: string;
  title: string;
  pricePerNight: number;
  currency: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  itemTotalPrice: number;
  itemTax: number;
  imageUrl?: string | null;
  roomType?: string;
}
interface FoundClient
  extends Pick<ClientUserPrisma, "id" | "name" | "email" | "phone"> {}

interface NewBookingState {
  arrivalDate?: Date | null;
  departureDate?: Date | null;
  adults: number;
  children: number;
  availableRoomsForSearch: RoomData[];
  selectedRoomsForCart: AgentBookingItem[];
  appliedRoomFilters: AgentFilterState;
  selectedClient?: FoundClient | null;
  newClientDetails?: { name: string; email: string; phone?: string };
  isCreatingNewClient: boolean;
  specialRequests?: string;
}
const initialBookingState: NewBookingState = {
  adults: 1,
  children: 0,
  availableRoomsForSearch: [],
  selectedRoomsForCart: [],
  appliedRoomFilters: { ...initialAgentFilterStateValues },
  isCreatingNewClient: false,
};

const AgentNewBookingPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingState, setBookingState] =
    useState<NewBookingState>(initialBookingState);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [fetchErrorRooms, setFetchErrorRooms] = useState<string | null>(null);
  const [showAgentFilters, setShowAgentFilters] = useState(false);
  const [clientSearchEmail, setClientSearchEmail] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<FoundClient[]>(
    []
  );
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientSearchAttempted, setClientSearchAttempted] = useState(false);
  const [clientSearchError, setClientSearchError] = useState<string | null>(
    null
  );
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const totalSteps = 4;

  const handleDatesGuestsSearch = (params: AgentBookingParams) => {
    if (!params.arrivalDate || !params.departureDate || params.adults < 1) {
      toast.error("Provide valid dates & at least 1 adult.");
      return;
    }
    if (params.arrivalDate >= params.departureDate) {
      toast.error("Departure must be after arrival.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (params.arrivalDate < today) {
      toast.error("Arrival date cannot be in the past.");
      return;
    }
    setBookingState((prev) => ({
      ...prev,
      arrivalDate: params.arrivalDate,
      departureDate: params.departureDate,
      adults: params.adults,
      children: params.children,
      availableRoomsForSearch: [],
      selectedRoomsForCart: [],
    }));
    searchAvailableRooms(params, bookingState.appliedRoomFilters);
    setCurrentStep(2);
  };
  const searchAvailableRooms = useCallback(
    async (params: AgentBookingParams, filters: AgentFilterState) => {
      if (!params.arrivalDate || !params.departureDate) return;
      setIsLoadingRooms(true);
      setFetchErrorRooms(null);
      setBookingState((prev) => ({ ...prev, availableRoomsForSearch: [] }));
      const query = new URLSearchParams({
        arrivalDate: params.arrivalDate.toISOString(),
        departureDate: params.departureDate.toISOString(),
        adults: params.adults.toString(),
        children: params.children.toString(),
        sortBy: filters.sortBy || "price_asc",
      });
      if (filters.maxPrice && parseFloat(filters.maxPrice.toString()) > 0)
        query.set("priceRange", filters.maxPrice.toString());
      if (filters.minGuests && filters.minGuests > 0)
        query.set("minGuests", filters.minGuests.toString());
      if (
        filters.roomType &&
        filters.roomType !== "" &&
        filters.roomType !== "_ANY_"
      )
        query.set("roomType", filters.roomType);
      if (filters.view && filters.view !== "" && filters.view !== "_ANY_")
        query.set("view", filters.view);
      if (filters.characteristics && filters.characteristics.length > 0)
        query.set("characteristics", filters.characteristics.join(","));
      try {
        const response = await fetch(
          `/api/reservations/rooms?${query.toString()}`
        ); // Uses client-facing room search
        const responseText = await response.text();
        if (!response.ok) {
          let errMsg = `Room search failed (${response.status})`;
          try {
            const errData = JSON.parse(responseText);
            errMsg = errData.message || errData.error || errMsg;
          } catch (e) {}
          throw new Error(errMsg);
        }
        const data: RoomData[] = JSON.parse(responseText);
        setBookingState((prev) => ({ ...prev, availableRoomsForSearch: data }));
        if (data.length === 0) toast.info("No rooms found for this criteria.");
      } catch (err: any) {
        setFetchErrorRooms(err.message);
        toast.error(err.message);
      } finally {
        setIsLoadingRooms(false);
      }
    },
    []
  );

  useEffect(() => {
    if (
      currentStep === 2 &&
      bookingState.arrivalDate &&
      bookingState.departureDate
    ) {
      searchAvailableRooms(
        {
          arrivalDate: bookingState.arrivalDate,
          departureDate: bookingState.departureDate,
          adults: bookingState.adults,
          children: bookingState.children,
        },
        bookingState.appliedRoomFilters
      );
    }
  }, [
    currentStep,
    bookingState.arrivalDate,
    bookingState.departureDate,
    bookingState.adults,
    bookingState.children,
    bookingState.appliedRoomFilters,
    searchAvailableRooms,
  ]);

  const handleApplyRoomFilters = (filtersFromPanel: AgentFilterState) => {
    setBookingState((prev) => ({
      ...prev,
      appliedRoomFilters: filtersFromPanel,
    }));
    setShowAgentFilters(false); // Will trigger useEffect to refetch rooms
  };
  const handleResetRoomFilters = () => {
    setBookingState((prev) => ({
      ...prev,
      appliedRoomFilters: initialAgentFilterStateValues,
    }));
    // Will trigger useEffect to refetch rooms
  };

  const handleSelectRoom = (room: RoomData) => {
    const { arrivalDate, departureDate, adults, children } = bookingState;
    if (!arrivalDate || !departureDate) {
      toast.error("Booking dates are missing.");
      return;
    }
    const nights = Math.max(
      1,
      Math.ceil(
        (departureDate.getTime() - arrivalDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const item: AgentBookingItem = {
      roomId: room.id,
      title: room.name,
      pricePerNight: room.price,
      currency: room.currency || "MAD",
      arrivalDate: arrivalDate.toISOString(),
      departureDate: departureDate.toISOString(),
      nights,
      adults,
      children,
      itemTotalPrice: room.price * nights,
      itemTax: parseFloat((room.price * nights * 0.1).toFixed(2)),
      imageUrl: room.imageUrl,
      roomType: room.bedType,
    };
    setBookingState((prev) => ({ ...prev, selectedRoomsForCart: [item] }));
    toast.success(`${room.name} selected.`);
  };

  const handleClientSearch = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedEmail = clientSearchEmail.trim();
    if (!trimmedEmail) {
      toast.error("Please enter an email.");
      return;
    }
    setIsSearchingClient(true);
    setClientSearchAttempted(true);
    setClientSearchResults([]);
    setClientSearchError(null);
    setBookingState((prev) => ({
      ...prev,
      selectedClient: null,
      isCreatingNewClient: false,
    }));
    try {
      const response = await fetch(
        `/api/agent/clients/search?email=${encodeURIComponent(trimmedEmail)}`
      );
      const responseText = await response.text();
      if (!response.ok) {
        let em = `Search fail (${response.status})`;
        try {
          const ed = JSON.parse(responseText);
          em = ed.message || em;
        } catch (e) {}
        throw new Error(em);
      }
      const data: { clients: FoundClient[] } = JSON.parse(responseText);
      if (data && Array.isArray(data.clients)) {
        setClientSearchResults(data.clients);
        if (data.clients.length === 0)
          toast.info("No client found. Create new?");
      } else {
        throw new Error("Unexpected API response for client search.");
      }
    } catch (err: any) {
      setClientSearchError(err.message);
      toast.error(err.message);
    } finally {
      setIsSearchingClient(false);
    }
  };
  const handleSelectFoundClient = (client: FoundClient) => {
    setBookingState((prev) => ({
      ...prev,
      selectedClient: client,
      isCreatingNewClient: false,
      newClientDetails: undefined,
    }));
    setClientSearchEmail(client.email);
    setClientSearchResults([]);
    setClientSearchAttempted(false);
    toast.success(`Client ${client.name} selected.`);
  };
  const handleProceedToCreateClient = (emailFromSearch?: string) => {
    setBookingState((prev) => ({
      ...prev,
      isCreatingNewClient: true,
      selectedClient: null,
    }));
    setClientSearchEmail(
      emailFromSearch || bookingState.newClientDetails?.email || ""
    );
    setNewClientName(bookingState.newClientDetails?.name || "");
    setNewClientPhone(bookingState.newClientDetails?.phone || "");
    setClientSearchResults([]);
    setClientSearchAttempted(false);
  };
  const handleSaveNewClientDetails = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newClientName.trim() || !clientSearchEmail.trim()) {
      toast.error("New client Name & Email required.");
      return;
    }
    setBookingState((prev) => ({
      ...prev,
      newClientDetails: {
        name: newClientName,
        email: clientSearchEmail,
        phone: newClientPhone,
      },
      selectedClient: null,
    }));
    toast.success("New client details captured. Proceed to finalize.");
    setCurrentStep(4);
  };

  const handleFinalizeBooking = async () => {
    if (bookingState.selectedRoomsForCart.length === 0) {
      toast.error("No room selected.");
      return;
    }
    if (!bookingState.isCreatingNewClient && !bookingState.selectedClient) {
      toast.error("Client information required.");
      return;
    }
    if (
      bookingState.isCreatingNewClient &&
      (!bookingState.newClientDetails?.name?.trim() ||
        !bookingState.newClientDetails?.email?.trim())
    ) {
      toast.error("New client name & email required.");
      return;
    }
    setIsSubmittingBooking(true);
    const toastId = toast.loading("Finalizing reservation...");
    const payload = {
      clientId: bookingState.selectedClient?.id,
      newClientDetails: bookingState.isCreatingNewClient
        ? bookingState.newClientDetails
        : undefined,
      roomIds: bookingState.selectedRoomsForCart.map((room) => room.roomId),
      checkInDate: bookingState.arrivalDate?.toISOString(),
      checkOutDate: bookingState.departureDate?.toISOString(),
      numAdults: bookingState.adults,
      numChildren: bookingState.children,
      totalPrice: bookingState.selectedRoomsForCart.reduce(
        (sum, item) => sum + item.itemTotalPrice + item.itemTax,
        0
      ),
      source: "RECEPTION",
      specialRequests: bookingState.specialRequests,
    };
    try {
      const response = await fetch("/api/agent/reservations", {
        // This should now hit your POST handler
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Reservation creation failed.");
      toast.success(result.message || "Reservation created successfully!", {
        id: toastId,
      });
      setCurrentStep(1);
      setBookingState(initialBookingState);
      setClientSearchEmail("");
      setNewClientName("");
      setNewClientPhone("");
      // router.push(`/agent/reservations/${result.reservation.id}`); // Optional navigate
    } catch (err: any) {
      toast.error(err.message || "Error finalizing booking.", { id: toastId });
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Dates & Guests
        return (
          <Card className="bg-slate-800/70 border-slate-700/50 shadow-xl mb-8 animate-fadeIn">
            <CardHeader>
              <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
                <CalendarDays />
                1. Select Dates & Guests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AgentBookingParamsSection
                onSearchRooms={handleDatesGuestsSearch} // <<< CORRECTED PROP NAME HERE
                isLoading={isLoadingRooms}
                initialParams={
                  bookingState.arrivalDate
                    ? {
                        arrivalDate: bookingState.arrivalDate,
                        departureDate: bookingState.departureDate,
                        adults: bookingState.adults,
                        children: bookingState.children,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        );
      case 2: // Room Selection
        return (
          <Card className="bg-slate-800/70 border-slate-700/50 shadow-xl mb-8 animate-fadeIn">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
                  <BedDouble />
                  2. Select Room(s)
                </CardTitle>
                {bookingState.arrivalDate && (
                  <CardDescription className="text-xs text-slate-400">
                    For {bookingState.adults}A, {bookingState.children}C from{" "}
                    {bookingState.arrivalDate.toLocaleDateString()} to{" "}
                    {bookingState.departureDate?.toLocaleDateString()}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAgentFilters(!showAgentFilters)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {showAgentFilters ? "Hide" : "Show"} Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentStep(1);
                    setBookingState((prev) => ({
                      ...prev,
                      availableRoomsForSearch: [],
                      selectedRoomsForCart: [],
                    }));
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Change Dates
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAgentFilters && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-fadeIn">
                  <AgentRoomFilter
                    filters={bookingState.appliedRoomFilters}
                    onFiltersChange={(filters) =>
                      setBookingState((prev) => ({
                        ...prev,
                        appliedRoomFilters: filters,
                      }))
                    }
                    onApplyFilters={() =>
                      handleApplyRoomFilters(bookingState.appliedRoomFilters)
                    }
                    onResetFilters={handleResetRoomFilters}
                  />
                </div>
              )}
              {isLoadingRooms && (
                <div className="text-center p-10">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="mt-2 text-slate-300">Searching...</p>
                </div>
              )}
              {fetchErrorRooms && (
                <div className="text-red-400 p-4 bg-red-900/30 rounded-md text-center">
                  <AlertTriangle className="inline mr-2" />
                  {fetchErrorRooms}
                </div>
              )}
              {!isLoadingRooms &&
                !fetchErrorRooms &&
                bookingState.availableRoomsForSearch.length === 0 && (
                  <div className="text-center text-slate-400 p-10">
                    No rooms found. Adjust criteria.
                  </div>
                )}
              {!isLoadingRooms &&
                !fetchErrorRooms &&
                bookingState.availableRoomsForSearch.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    {bookingState.availableRoomsForSearch.map((room) => (
                      <AgentRoomCard
                        key={room.id}
                        {...room}
                        onSelectRoom={() => handleSelectRoom(room)}
                        isSelected={bookingState.selectedRoomsForCart.some(
                          (r) => r.roomId === room.id
                        )}
                      />
                    ))}
                  </div>
                )}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="border-slate-600 hover:bg-slate-700/50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={bookingState.selectedRoomsForCart.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Next: Client Info <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 3: // Client Information
        return (
          <Card className="bg-slate-800/70 border-slate-700/50 shadow-xl animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
                <UserSearch />
                3. Client Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Rooms
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {!bookingState.isCreatingNewClient ? (
                <>
                  <form onSubmit={handleClientSearch} className="space-y-3">
                    <Label
                      htmlFor="clientSearchEmailInput"
                      className="text-sm font-medium text-slate-300"
                    >
                      Search Existing Client by Email
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="clientSearchEmailInput"
                        type="email"
                        value={clientSearchEmail}
                        onChange={(e) => setClientSearchEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="bg-slate-700 border-slate-600 placeholder-slate-500"
                      />
                      <Button
                        type="submit"
                        disabled={
                          isSearchingClient || !clientSearchEmail.trim()
                        }
                        className="bg-cyan-600 hover:bg-cyan-700 min-w-[100px]"
                      >
                        {isSearchingClient ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SearchIcon className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Search</span>
                      </Button>
                    </div>
                  </form>
                  {isSearchingClient && (
                    <div className="text-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      <span className="text-slate-300 ml-2">Searching...</span>
                    </div>
                  )}
                  {clientSearchError && !isSearchingClient && (
                    <div className="p-3 my-3 bg-red-900/30 text-red-300 border border-red-700/50 rounded-md text-sm text-center">
                      <AlertTriangle className="inline w-4 h-4 mr-2" />{" "}
                      {clientSearchError}
                    </div>
                  )}
                  {!isSearchingClient &&
                    clientSearchAttempted &&
                    clientSearchResults.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-slate-700 mt-4 max-h-60 overflow-y-auto p-1">
                        <h4 className="text-sm font-medium text-slate-300">
                          {clientSearchResults.length} Client(s) Found:
                        </h4>
                        {clientSearchResults.map((client) => (
                          <Card
                            key={client.id}
                            className="p-3 bg-slate-700/50 border-slate-600 hover:border-cyan-500/70 cursor-pointer transition-colors"
                            onClick={() => handleSelectFoundClient(client)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-slate-100 flex items-center gap-2">
                                  <User size={16} /> {client.name}
                                </p>
                                <p className="text-xs text-slate-400 ml-7 flex items-center gap-2">
                                  <Mail size={12} /> {client.email}
                                </p>
                                {client.phone && (
                                  <p className="text-xs text-slate-400 ml-7 flex items-center gap-2">
                                    <PhoneCall size={12} /> {client.phone}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Select
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  {!isSearchingClient &&
                    clientSearchAttempted &&
                    clientSearchResults.length === 0 &&
                    !clientSearchError && (
                      <div className="text-center p-4 text-slate-400 mt-2">
                        No client found for "
                        <span className="font-semibold text-slate-300">
                          {clientSearchEmail}
                        </span>
                        ".
                      </div>
                    )}
                  <Separator className="my-4 bg-slate-700" />
                  <div className="text-center">
                    <Button
                      onClick={() =>
                        handleProceedToCreateClient(clientSearchEmail)
                      }
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Or Create New Client
                    </Button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={handleSaveNewClientDetails}
                  className="space-y-4 p-4 border border-dashed border-slate-600 rounded-md bg-slate-900/30"
                >
                  <h4 className="text-md font-semibold text-slate-100 border-b border-slate-700 pb-2">
                    Create New Client Profile
                  </h4>
                  <div>
                    <Label
                      htmlFor="newClientEmailInput"
                      className="text-slate-300 text-sm"
                    >
                      Email*
                    </Label>
                    <Input
                      type="email"
                      id="newClientEmailInput"
                      value={clientSearchEmail}
                      onChange={(e) => setClientSearchEmail(e.target.value)}
                      required
                      className="mt-1 bg-slate-700/80 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="newClientNameInput"
                      className="text-slate-300 text-sm"
                    >
                      Full Name*
                    </Label>
                    <Input
                      type="text"
                      id="newClientNameInput"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      required
                      className="mt-1 bg-slate-700/80 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="newClientPhoneInput"
                      className="text-slate-300 text-sm"
                    >
                      Phone (Optional)
                    </Label>
                    <Input
                      type="tel"
                      id="newClientPhoneInput"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="mt-1 bg-slate-700/80 border-slate-600"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBookingState((prev) => ({
                          ...prev,
                          isCreatingNewClient: false,
                        }))
                      }
                      className="border-slate-600 hover:bg-slate-700/50 w-full sm:w-auto"
                    >
                      <ArrowLeft className="mr-2" />
                      Back to Search
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Save Client & Proceed
                    </Button>
                  </div>
                </form>
              )}
              {(bookingState.selectedClient ||
                (bookingState.isCreatingNewClient &&
                  bookingState.newClientDetails?.email &&
                  bookingState.newClientDetails?.name)) &&
                bookingState.selectedRoomsForCart.length > 0 &&
                !bookingState.isCreatingNewClient && (
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-lg py-3"
                  >
                    Proceed to Confirmation{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
            </CardContent>
          </Card>
        );
      case 4: // Confirmation & Finalize
        if (bookingState.selectedRoomsForCart.length === 0) {
          setCurrentStep(2);
          return null;
        }
        const bookingSummary = bookingState.selectedRoomsForCart[0];
        const clientDisplay = bookingState.isCreatingNewClient
          ? `${bookingState.newClientDetails?.name} (${bookingState.newClientDetails?.email}) (New)`
          : `${bookingState.selectedClient?.name} (${bookingState.selectedClient?.email})`;
        return (
          <Card className="bg-slate-800/70 border-slate-700/50 shadow-xl animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-xl text-cyan-300 flex items-center gap-2">
                <CheckCircle />
                4. Confirm & Finalize
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Client
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-2">
                <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                  <HotelIcon size={18} className="text-amber-400" />
                  {bookingSummary.title}
                </h3>
                {bookingSummary.imageUrl && (
                  <div className="aspect-video relative w-full max-w-sm mx-auto rounded overflow-hidden">
                    <Image
                      src={bookingSummary.imageUrl}
                      alt={bookingSummary.title}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                )}
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Room Type:</span>{" "}
                  {bookingSummary.roomType}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Dates:</span>{" "}
                  {new Date(bookingSummary.arrivalDate).toLocaleDateString()} -{" "}
                  {new Date(bookingSummary.departureDate).toLocaleDateString()}{" "}
                  ({bookingSummary.nights} nights)
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Guests:</span>{" "}
                  {bookingSummary.adults} Adults
                  {bookingSummary.children > 0
                    ? `, ${bookingSummary.children} Children`
                    : ""}
                </p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                  <User className="text-amber-400" size={18} />
                  Client Details
                </h3>
                <p className="text-sm text-slate-300">{clientDisplay}</p>
                {bookingState.isCreatingNewClient &&
                  bookingState.newClientDetails?.phone && (
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-slate-400">Phone:</span>{" "}
                      {bookingState.newClientDetails.phone}
                    </p>
                  )}
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-amber-500/30 text-center">
                <p className="text-sm text-amber-200">
                  Total Price (incl. tax)
                </p>
                <p className="text-3xl font-bold text-amber-400">
                  {(
                    bookingSummary.itemTotalPrice + bookingSummary.itemTax
                  ).toFixed(2)}{" "}
                  {bookingSummary.currency}
                </p>
              </div>
              <Button
                onClick={handleFinalizeBooking}
                disabled={isSubmittingBooking}
                className="w-full text-lg py-3 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/50"
              >
                {isSubmittingBooking ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="mr-2 h-6 w-6" />
                )}
                {isSubmittingBooking
                  ? "Processing..."
                  : "Confirm & Create Reservation"}
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return <p className="text-red-400 text-center">Invalid step.</p>;
    }
  };
  const progress = Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="space-y-6">
      {" "}
      {/* Max width for stepper */}
      <div className="flex items-center gap-3 mb-6 p-6 bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl">
        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
          <CalendarPlus size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            New Guest Reservation
          </h1>
          <p className="text-slate-400 text-sm">
            Create a booking for clients at the reception or over the phone.
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-slate-400 mb-4 px-2">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-1.5 rounded-full transition-colors ${
                currentStep >= step ? "bg-cyan-500" : "bg-slate-700"
              }`}
            ></div>
          ))}
        </div>
      </div>
      {renderStepContent()}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AgentNewBookingPage;
