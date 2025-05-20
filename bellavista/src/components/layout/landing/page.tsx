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

      {/* === Second Section: Room Background === */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/roomBack.jpg"
            alt="Luxury hotel room background"
            fill
            className="object-cover scale-x-[-1]"
            quality={100}
            priority
          />
          <div className="absolute top-0 left-0 right-0 h-24 sm:h-48 bg-gradient-to-b from-black to-transparent"></div>
        </div>

        <div className="relative py-20 md:py-0 md:h-full flex flex-col items-start justify-center px-6 sm:px-16 max-w-xl z-10">
          <div className="hidden sm:block absolute left-4 sm:left-8 top-1/4 bottom-1/4 w-0.5 bg-white opacity-80"></div>

          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-white">
            <Image
              src="/palme.png"
              alt="Palm Decoration"
              width={isMobile ? 60 : 100}
              height={isMobile ? 30 : 50}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 text-white">
            Luxury redefined
          </h2>

          <p className="text-base sm:text-lg text-white mb-6 sm:mb-8 leading-relaxed">
            Our rooms are designed to transport you into an environment made for
            leisure. Take your mind off the day-to-day of home life and find a
            private paradise for yourself.
          </p>

          <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 sm:px-8 py-2 sm:py-3 rounded-md transition-all duration-300">
            EXPLORE
          </button>
        </div>
      </section>

      {/* === Third Section: Beach Background === */}
      <section className="relative min-h-[500px] sm:min-h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/beachBack.jpg"
            alt="Sandy beach with ocean view"
            fill
            className="object-cover"
            quality={100}
            priority
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 right-0 h-16 sm:h-28 bg-gradient-to-b from-black to-transparent"></div>
        </div>

        <div className="relative py-20 md:py-0 md:min-h-[600px] flex flex-col items-start md:items-end justify-center px-6 sm:px-16 mx-auto md:ml-auto md:mr-16 max-w-xl z-10">
          <div className="hidden sm:block absolute right-4 sm:right-8 top-1/4 bottom-1/4 w-0.5 bg-white opacity-80"></div>

          <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 text-white text-2xl sm:text-3xl">
            🌴
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 text-white">
            Feel the sand under your feet
          </h2>

          <div className="text-base sm:text-lg text-white mb-6 sm:mb-8 leading-relaxed">
            <p>We love life at the beach. Being close</p>
            <p>to the ocean with access to endless sandy</p>
            <p>beach ensures a relaxed state of mind.</p>
            <p>It seems like time stands still watching the ocean.</p>
          </div>

          <button className="bg-white hover:bg-white/90 text-blue-900 font-medium px-6 sm:px-8 py-2 sm:py-3 rounded-md transition-all duration-300">
            EXPLORE
          </button>
        </div>
      </section>

      {/* === Fourth Section: Gallery === */}
      <section className="relative">
        <Gallery />
      </section>
    </div>
  );
}
