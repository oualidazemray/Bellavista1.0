"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Gallery from "../gallery/Gallery";

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* === Hero Video Section === */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
          >
            <source src="/backVid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        </div>

        <div className="relative z-10 flex flex-col items-start justify-center px-4 sm:px-8 pt-16 sm:pt-32 h-screen">
          <div className="max-w-4xl">
            <div className="text-white mb-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif mb-2 dark:text-gray-200">
                Hotel{" "}
                <span className="inline-block">
                  <Image
                    src="/logo.png"
                    alt="Bellavista Logo"
                    width={isMobile ? 200 : 300}
                    height={isMobile ? 35 : 50}
                    className="object-contain translate-y-6 sm:translate-y-10"
                  />
                </span>
              </h1>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white font-light dark:text-gray-300 mt-8">
              More Than a Vista, It's a Paradista
            </h2>

            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <button
                className="bg-amber-600/25 rounded-full p-2 sm:p-3 animate-bounce"
                aria-label="Scroll down"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-10 text-white dark:text-gray-200">
            <Image
              src="/palm.png"
              alt="Palm Decoration"
              width={isMobile ? 30 : 50}
              height={isMobile ? 30 : 50}
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* === Fourth Section: Gallery === */}
      <section className="relative">
        <Gallery />
      </section>
    </div>
  );
}
