// src/components/ui/client/BookingSection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Calendar,
  Users,
  Tag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export interface BookingParams {
  arrivalDate: Date;
  departureDate: Date;
  adults: number;
  children: number;
  promoCode?: string;
}

interface BookingSectionProps {
  onCheckAvailability: (params: BookingParams) => void;
  isLoading?: boolean;
}

export default function BookingSection({
  onCheckAvailability,
  isLoading = false,
}: BookingSectionProps) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [promoCodeVisible, setPromoCodeVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const nights =
    arrivalDate && departureDate
      ? Math.max(
          0,
          Math.ceil(
            (departureDate.getTime() - arrivalDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const handleArrivalChange = (date: Date | null) => {
    setArrivalDate(date);
    if (date && departureDate && date.getTime() >= departureDate.getTime()) {
      const newDepartureDate = new Date(date.getTime());
      newDepartureDate.setDate(date.getDate() + 1);
      setDepartureDate(newDepartureDate);
    } else if (!date) {
      setDepartureDate(null);
    }
  };

  const handleDepartureChange = (date: Date | null) => {
    if (arrivalDate && date && date.getTime() <= arrivalDate.getTime()) return;
    setDepartureDate(date);
  };

  const increment = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => setter(value + 1);
  const decrement = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    min: number = 0
  ) => {
    if (value > min) setter(value - 1);
  };
  useEffect(() => {
    const today = new Date();
    const initialArrival = new Date(today);
    initialArrival.setDate(today.getDate() + 1); // Tomorrow

    const initialDeparture = new Date(today);
    initialDeparture.setDate(today.getDate() + 2); // Day after tomorrow

    setArrivalDate(initialArrival);
    setDepartureDate(initialDeparture);
  }, []);
  const handleCheckAvailabilityClick = () => {
    if (arrivalDate && departureDate && nights > 0) {
      onCheckAvailability({
        arrivalDate,
        departureDate,
        adults,
        children,
        promoCode: promoCode || undefined,
      });
    } else {
      alert(
        "Please select valid arrival and departure dates (minimum 1 night)."
      );
    }
  };

  return (
    <section className="relative py-6 md:py-8 bg-gradient-to-b from-[#1a130e]/70 to-transparent">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl shadow-2xl overflow-hidden border border-amber-500/40">
          <div className="bg-gradient-to-b from-black to-[#1a130e]/70 text-white backdrop-blur-md p-4 md:p-6">
            <h2 className="text-2xl md:text-3xl font-serif text-amber-100">
              Book Your Perfect Stay
            </h2>
            <p className="text-amber-300/80 mt-1 text-sm md:text-base">
              Find your paradise getaway
            </p>
          </div>
          <div className="p-4 md:p-6 backdrop-blur-sm bg-[#1a130e]/80">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-end">
              <div className="space-y-1.5">
                <label className="block font-medium text-orange-200 text-xs md:text-sm">
                  Check-in / Check-out
                </label>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <DatePicker
                      selected={arrivalDate}
                      onChange={handleArrivalChange}
                      dateFormat="dd MMM yyyy"
                      minDate={new Date()}
                      className="w-full p-2.5 md:p-3 bg-transparent border border-gray-600 hover:border-amber-600 rounded-lg text-amber-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 pr-10 placeholder-amber-300/70 text-sm md:text-base"
                      placeholderText="Arrival"
                      popperClassName="z-[100]"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
                      size={16}
                    />
                  </div>
                  <div className="relative">
                    <DatePicker
                      selected={departureDate}
                      onChange={handleDepartureChange}
                      dateFormat="dd MMM yyyy"
                      minDate={
                        arrivalDate
                          ? new Date(arrivalDate.getTime() + 86400000)
                          : new Date(Date.now() + 86400000)
                      }
                      className="w-full p-2.5 md:p-3 bg-transparent border border-gray-600 hover:border-amber-600 rounded-lg text-amber-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 pr-10 placeholder-amber-300/70 text-sm md:text-base"
                      placeholderText="Departure"
                      disabled={!arrivalDate}
                      popperClassName="z-[100]"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
                      size={16}
                    />
                  </div>
                  {nights > 0 && (
                    <div className="text-xs text-amber-400 font-medium pt-1">
                      {nights} {nights === 1 ? "night" : "nights"}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-medium text-orange-200 text-xs md:text-sm">
                  Guests
                </label>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between p-2.5 md:p-3 bg-transparent border border-gray-600 rounded-lg">
                    <div>
                      <span className="text-amber-100 text-sm">Adults</span>
                      <p className="text-xs text-amber-300/70">Ages 13+</p>
                    </div>
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                      <button
                        className="w-7 h-7 btn-guest"
                        onClick={() => decrement(setAdults, adults, 1)}
                        disabled={adults <= 1}
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-amber-300 font-medium text-sm">
                        {adults}
                      </span>
                      <button
                        className="w-7 h-7 btn-guest"
                        onClick={() => increment(setAdults, adults)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 md:p-3 bg-transparent border border-gray-600 rounded-lg">
                    <div>
                      <span className="text-amber-100 text-sm">Children</span>
                      <p className="text-xs text-amber-300/70">Ages 0-12</p>
                    </div>
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                      <button
                        className="w-7 h-7 btn-guest"
                        onClick={() => decrement(setChildren, children)}
                        disabled={children <= 0}
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-amber-300 font-medium text-sm">
                        {children}
                      </span>
                      <button
                        className="w-7 h-7 btn-guest"
                        onClick={() => increment(setChildren, children)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-medium text-orange-200 text-xs md:text-sm">
                  Promotion
                </label>
                <div>
                  <button
                    className="w-full flex items-center justify-between p-2.5 md:p-3 bg-transparent border border-gray-600 rounded-lg text-left hover:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    onClick={() => setPromoCodeVisible(!promoCodeVisible)}
                  >
                    <div className="flex items-center">
                      <Tag className="mr-2 text-amber-500" size={14} />
                      <span className="text-amber-100 text-sm">
                        {promoCode ? promoCode : "Add code"}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-amber-500 transition-transform duration-300 ${
                        promoCodeVisible ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {promoCodeVisible && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="w-full p-2.5 md:p-3 bg-transparent border border-gray-600 rounded-lg text-amber-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-amber-300/70 text-sm md:text-base"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col justify-end space-y-1.5">
                <label className="block font-medium text-orange-200 text-xs md:text-sm text-transparent select-none h-[1.25rem] md:h-[1.5rem]">
                  Action
                </label>{" "}
                {/* Adjusted spacer label height */}
                <button
                  onClick={handleCheckAvailabilityClick}
                  disabled={
                    isLoading || !arrivalDate || !departureDate || nights <= 0
                  }
                  className="w-full py-3 md:py-3.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/40 disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="font-medium">Check Availability</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-[10px] md:text-xs text-amber-300/70 text-center">
                  Best rate guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .btn-guest {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background-color: rgba(245, 158, 11, 0.2); /* amber-500/20 */
          color: #fde68a; /* amber-200 */
        }
        .btn-guest:hover {
          background-color: rgba(245, 158, 11, 0.4); /* amber-500/40 */
        }
        .btn-guest:disabled {
          opacity: 0.5;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          background-color: transparent !important;
        }
        .react-datepicker {
          font-family: "Inter", sans-serif !important;
          background-color: #2d241c !important;
          border: 1px solid #4a3b2c !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 8px 10px -6px rgba(0, 0, 0, 0.2);
        }
        .react-datepicker__header {
          background-color: #3a2d23 !important;
          border-bottom: 1px solid #5a4b3c !important;
          padding-top: 8px !important;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name {
          color: #fcd34d !important;
          font-weight: 500 !important;
        }
        .react-datepicker__day-name {
          font-size: 0.75rem !important;
        }
        .react-datepicker__day {
          color: #fef3c7 !important;
          font-size: 0.8rem !important;
          width: 2rem !important;
          height: 2rem !important;
          line-height: 2rem !important;
        }
        .react-datepicker__day:hover {
          background-color: #785c3a !important;
          color: #ffffff !important;
          border-radius: 50% !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background-color: #f59e0b !important;
          color: #1c1917 !important;
          border-radius: 50% !important;
          font-weight: 600 !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #d97706 !important;
          color: #ffffff !important;
          border-radius: 50% !important;
        }
        .react-datepicker__day--disabled {
          color: #6b7280 !important;
          opacity: 0.6;
        }
        .react-datepicker__day--outside-month {
          opacity: 0.4;
        }
        .react-datepicker-popper {
          z-index: 100 !important;
        }
        .react-datepicker__navigation {
          top: 12px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #fcd34d !important;
          border-width: 2px 2px 0 0 !important;
          height: 7px !important;
          width: 7px !important;
        }
        .react-datepicker__navigation:hover
          .react-datepicker__navigation-icon::before {
          border-color: #fff !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </section>
  );
}
