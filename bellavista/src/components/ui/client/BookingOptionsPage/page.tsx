import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

const bookingOptions = [
  {
    id: "sejour",
    title: "SÉJOUR",
    description: "Découvrez nos chambres et suites luxueuses",
    image:
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    path: "/sejour",
  },
  {
    id: "table",
    title: "TABLE",
    description: "Une expérience gastronomique exceptionnelle",
    image:
      "https://images.pexels.com/photos/3269007/pexels-photo-3269007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    path: "/table",
  },
  {
    id: "soin",
    title: "SOIN",
    description: "Relaxez-vous dans notre spa de luxe",
    image:
      "https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg?auto=compress&cs=tinysrgb&w=1260&h=750",
    path: "/soin",
  },
  {
    id: "evenement",
    title: "ÉVÈNEMENT",
    description: "Des espaces parfaits pour vos célébrations",
    image:
      "https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    path: "/evenement",
  },
  {
    id: "offres",
    title: "OFFRES SPÉCIALES",
    description: "Découvrez nos promotions exclusives",
    image:
      "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    path: "/offres",
  },
];

export default function BookingOptionsPage() {
  const [activeOption, setActiveOption] = useState("sejour");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setImagesLoaded((prev) => ({ ...prev, [src]: true }));
          resolve(src);
        };
        img.onerror = () => {
          setImagesLoaded((prev) => ({ ...prev, [src]: false }));
          reject(new Error(`Failed to load image: ${src}`));
        };
      });
    };

    const imagePromises = bookingOptions.map((option) =>
      loadImage(option.image)
    );

    Promise.allSettled(imagePromises).then(() => {
      setAllImagesLoaded(true);
    });
  }, []);

  // Handle navigation
  const handleClick = (path) => {
    window.location.href = path;
  };

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden bg-black/80">
      <div className="absolute inset-0 z-0">
        <img
          src="/beachBack.jpg"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Mobile menu toggle button */}
      <button
        className="lg:hidden absolute top-4 right-4 z-50 bg-black bg-opacity-50 p-2 rounded-full"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`block w-5 h-0.5 bg-white mb-1 transition-transform ${
              isMenuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-white transition-opacity ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-5 h-0.5 bg-white mt-1 transition-transform ${
              isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></span>
        </div>
      </button>

      {/* Main content layout */}
      <div className="flex flex-col lg:flex-row h-full w-full">
        {/* Image section */}
        <div className="relative w-full h-1/2 lg:h-full lg:w-3/5">
          {bookingOptions.map((option) => (
            <div
              key={option.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                activeOption === option.id
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105"
              }`}
            >
              <img
                src={option.image}
                alt={option.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent lg:from-transparent lg:via-black/20 lg:to-black/50" />

              {/* Mobile title overlay */}
              <div className="absolute inset-0 flex items-center justify-center lg:hidden">
                <div className="text-center">
                  <h2 className="text-4xl font-light text-white mb-2">
                    {option.title}
                  </h2>
                  <p className="text-white/80 text-sm max-w-xs mx-auto">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden fixed inset-0 z-40 bg-black bg-opacity-95 transform transition-transform duration-500 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col justify-center h-full px-8 py-20">
            {bookingOptions.map((option, index) => (
              <div
                key={option.id}
                className={`py-4 border-b border-yellow-600/30 ${
                  index === 0 ? "border-t" : ""
                }`}
                onClick={() => {
                  setActiveOption(option.id);
                  setIsMenuOpen(false);
                  setTimeout(() => handleClick(option.path), 300);
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-white">
                    {option.title}
                  </h2>
                  <ChevronRight className="text-yellow-600 h-5 w-5" />
                </div>
                <p className="text-white/60 text-sm mt-1">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop options navigation */}
        <div className="hidden lg:flex absolute right-0 top-0 h-full items-center">
          <div className="h-full flex flex-col justify-center pr-12 md:pr-16 lg:pr-24 relative">
            {/* Gold accent line for main options */}
            <div className="absolute left-0 top-20 bottom-28 w-px bg-yellow-600"></div>

            {/* Main navigation options */}
            <div className="flex flex-col space-y-8 pl-8">
              {bookingOptions.slice(0, 4).map((option) => (
                <div
                  key={option.id}
                  className="group cursor-pointer"
                  onMouseEnter={() => setActiveOption(option.id)}
                  onClick={() => handleClick(option.path)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-0 h-px bg-yellow-600 transition-all duration-300 mr-2 group-hover:w-6 ${
                        activeOption === option.id ? "w-6" : "w-0"
                      }`}
                    ></div>
                    <h2
                      className={`text-2xl sm:text-3xl font-light tracking-wide transition-colors duration-300 ${
                        activeOption === option.id
                          ? "text-yellow-600"
                          : "text-white group-hover:text-yellow-600/80"
                      }`}
                      style={{ fontFamily: "serif" }}
                    >
                      {option.id === "sejour" ? <>SÉJOUR</> : option.title}
                    </h2>
                  </div>
                </div>
              ))}
            </div>

            {/* Special offers section */}
            <div className="mt-16 pl-8 relative">
              <div className="absolute left-0 top-0 h-12 w-px bg-yellow-600"></div>
              <div
                className="group cursor-pointer"
                onMouseEnter={() => setActiveOption("offres")}
                onClick={() => handleClick("/offres")}
              >
                <div className="flex items-center">
                  <div
                    className={`w-0 h-px bg-yellow-600 transition-all duration-300 mr-2 group-hover:w-6 ${
                      activeOption === "offres" ? "w-6" : "w-0"
                    }`}
                  ></div>
                  <h2
                    className={`text-2xl sm:text-3xl font-light tracking-wide transition-colors duration-300 ${
                      activeOption === "offres"
                        ? "text-yellow-600"
                        : "text-white group-hover:text-yellow-600/80"
                    }`}
                    style={{ fontFamily: "serif" }}
                  >
                    {bookingOptions[4].title}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
