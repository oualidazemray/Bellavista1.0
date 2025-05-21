import { useState } from "react";
import { ChevronRight } from "lucide-react";

// Define the booking options with their respective images
const bookingOptions = [
  {
    id: "stay",
    title: "SÉJOUR",
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    description: "Découvrez nos chambres luxueuses avec vue sur la mer",
  },
  {
    id: "table",
    title: "TABLE",
    image: "https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg",
    description: "Réservez une table dans notre restaurant gastronomique",
  },
  {
    id: "spa",
    title: "SOIN",
    image:
      "https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg",
    description: "Profitez de nos soins relaxants et revitalisants",
  },
  {
    id: "event",
    title: "ÉVÈNEMENT",
    image: "https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg",
    description: "Organisez vos événements spéciaux dans un cadre exceptionnel",
  },
  {
    id: "offers",
    title: "OFFRES SPÉCIALES",
    image: "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg",
    description: "Découvrez nos offres exclusives pour un séjour inoubliable",
  },
];

export default function BookingOptionsPage() {
  const [activeOption, setActiveOption] = useState("stay");

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-black">
      {/* Left side - Image section */}
      <div className="relative w-full lg:w-3/5 h-1/2 lg:h-screen overflow-hidden">
        {bookingOptions.map((option) => (
          <div
            key={option.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              activeOption === option.id ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={option.image}
              alt={option.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
      </div>

      {/* Right side - Options section */}
      <div className="w-full lg:w-2/5 h-1/2 lg:h-screen bg-black flex flex-col justify-center px-8 lg:px-12">
        <div>
          <h1 className="text-3xl lg:text-4xl text-gold font-seasons text-center mb-12 font-light">
            VOTRE EXPÉRIENCE
          </h1>

          <div className="space-y-6 lg:space-y-8">
            {bookingOptions.map((option) => (
              <div
                key={option.id}
                className="group"
                onMouseEnter={() => setActiveOption(option.id)}
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <h2
                    className={`text-xl lg:text-2xl font-seasons transition-colors duration-300 ${
                      activeOption === option.id ? "text-gold" : "text-white"
                    }`}
                  >
                    {option.title}
                  </h2>
                  <ChevronRight
                    className={`transition-colors duration-300 ${
                      activeOption === option.id ? "text-gold" : "text-white"
                    }`}
                    size={24}
                  />
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    activeOption === option.id ? "max-h-20 mt-2" : "max-h-0"
                  }`}
                >
                  <p className="text-gray-300 text-sm">{option.description}</p>
                </div>

                <div
                  className={`w-full h-px mt-3 transition-colors duration-300 ${
                    activeOption === option.id ? "bg-gold" : "bg-gray-700"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
