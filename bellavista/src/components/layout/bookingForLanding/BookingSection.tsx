"use client";

import { useState } from "react";
import { ChevronDown, Calendar, Users, Tag, ArrowRight } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BookingSection() {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [promoCodeVisible, setPromoCodeVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [arrivalDate, setArrivalDate] = useState(new Date());
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000)
  );

  // Calculate number of nights
  const nights = Math.ceil(
    (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
  );

  // Handle person count changes
  const increment = (setter, value) => setter(value + 1);
  const decrement = (setter, value) => {
    if (value > 0) setter(value - 1);
  };

  return (
    <section className="relative py-8">
      <div className="container  mx-auto px-4">
        <div className="rounded-2xl  overflow-hidden">
          {/* Header */}
          <div className="bg-black/90 text-white  p-6">
            <h2 className="text-3xl font-serif">Book Your Perfect Stay</h2>
            <p className="text-amber-200 mt-1">Find your paradise getaway</p>
          </div>

          {/* Booking form */}
          <div className="p-6 bg-gradient-to-b from-black/90 via-black/90 to-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date selection */}
              <div className="space-y-4">
                <label className="block font-medium text-orange-200">
                  Check-in / Check-out
                </label>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <DatePicker
                      selected={arrivalDate}
                      onChange={(date) => setArrivalDate(date)}
                      dateFormat="dd MMM yyyy"
                      minDate={new Date()}
                      className="w-full p-3  border border-gray-300 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholderText="Select arrival"
                    />
                    <Calendar
                      className="absolute right-3 top-3 text-amber-500"
                      size={18}
                    />
                  </div>

                  <div className="relative">
                    <DatePicker
                      selected={departureDate}
                      onChange={(date) => setDepartureDate(date)}
                      dateFormat="dd MMM yyyy"
                      minDate={new Date(arrivalDate.getTime() + 86400000)}
                      className="w-full p-3  border border-gray-300 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholderText="Select departure"
                    />
                    <Calendar
                      className="absolute right-3 top-3 text-amber-500"
                      size={18}
                    />
                  </div>

                  {nights > 0 && (
                    <div className="text-sm text-amber-600 font-medium">
                      {nights} {nights === 1 ? "night" : "nights"}
                    </div>
                  )}
                </div>
              </div>

              {/* Guests selection */}
              <div className="space-y-4">
                <label className="block font-medium text-orange-200">
                  Guests
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3  border border-gray-300 rounded-lg">
                    <div>
                      <span className="text-amber-100">Adults</span>
                      <p className="text-xs text-amber-50">Ages 13+</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200"
                        onClick={() => decrement(setAdults, adults)}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-amber-400 font-medium">
                        {adults}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200"
                        onClick={() => increment(setAdults, adults)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3  border border-gray-300 rounded-lg">
                    <div>
                      <span className="text-amber-100">Children</span>
                      <p className="text-xs text-amber-50">Ages 0-12</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200"
                        onClick={() => decrement(setChildren, children)}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-amber-400 font-medium">
                        {children}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200"
                        onClick={() => increment(setChildren, children)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotion Code */}
              <div className="space-y-4">
                <label className="block font-medium text-orange-200">
                  Promotion
                </label>
                <div>
                  <button
                    className="w-full flex items-center justify-between p-3  border border-gray-300 rounded-lg text-left hover:border-amber-500"
                    onClick={() => setPromoCodeVisible(!promoCodeVisible)}
                  >
                    <div className="flex items-center">
                      <Tag className="mr-2 text-amber-500" size={18} />
                      <span className="text-amber-100">
                        {promoCode ? promoCode : "Add promotion code"}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
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
                        placeholder="Enter promotion code"
                        className="w-full p-3  border border-gray-300 rounded-lg text-amber-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Book Now button */}
              <div className="flex flex-col justify-end space-y-4">
                <label className="block font-medium text-orange-200">
                  Ready to book?
                </label>
                <button className="w-full py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-300 flex items-center justify-center space-x-2 shadow-md">
                  <span className="font-medium">Check Availability</span>
                  <ArrowRight size={18} />
                </button>
                <p className="text-xs text-amber-50 text-center">
                  Best rate guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
