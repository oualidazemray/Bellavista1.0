"use client";

import { useState } from "react";
import BookingSection from "../bookingForLanding/BookingSection";
import Footer from "../Footer/Footer";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  // Array of gallery images with src, alt text and description - using darker images
  const galleryImages = [
    {
      src: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg",
      alt: "Fine dining setup",
      description:
        "Elegant table settings in our award-winning restaurant featuring ambient lighting and sophisticated decor.",
    },
    {
      src: "https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg",
      alt: "Luxury cocktail bar",
      description:
        "Our master mixologists craft signature cocktails in the intimate atmosphere of our lounge bar.",
    },
    {
      src: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
      alt: "Night swim",
      description:
        "Experience our illuminated pool area, perfect for evening relaxation under the stars.",
    },
    {
      src: "https://images.pexels.com/photos/169992/pexels-photo-169992.jpeg",
      alt: "Luxury suite",
      description:
        "Our premium suites offer unparalleled comfort with elegant furnishings and attention to detail.",
    },
    {
      src: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
      alt: "Waterfront dining",
      description:
        "Enjoy exquisite cuisine with spectacular waterfront views from our terrace restaurant.",
    },
    {
      src: "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
      alt: "Cozy coffee corner",
      description:
        "Our café offers premium coffee and pastries in a warm, inviting atmosphere.",
    },
    {
      src: "https://images.pexels.com/photos/3201763/pexels-photo-3201763.jpeg",
      alt: "Luxury bathroom",
      description:
        "Indulge in our spa-inspired bathrooms featuring premium amenities and elegant design.",
    },
    {
      src: "https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg",
      alt: "Conference facilities",
      description:
        "State-of-the-art meeting rooms equipped with the latest technology for your business needs.",
    },
    {
      src: "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg",
      alt: "Evening beach setup",
      description:
        "Romantic beachfront dining experiences under the stars with torch lighting.",
    },
    {
      src: "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg",
      alt: "Spa treatment room",
      description:
        "Rejuvenate in our tranquil spa treatment rooms with expert therapists and premium products.",
    },
    {
      src: "https://images.pexels.com/photos/5490917/pexels-photo-5490917.jpeg",
      alt: "Dark ambiance dining",
      description:
        "Our signature restaurant offers an intimate atmosphere with exquisite tasting menus.",
    },
    {
      src: "https://images.pexels.com/photos/237371/pexels-photo-237371.jpeg",
      alt: "Infinity pool view",
      description:
        "Our infinity pool offers panoramic views of the surrounding landscape.",
    },
    {
      src: "https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg",
      alt: "Beach sunset",
      description:
        "Experience breathtaking sunsets from our private beach access.",
    },
    {
      src: "https://images.pexels.com/photos/3201921/pexels-photo-3201921.jpeg",
      alt: "Luxury bedroom",
      description:
        "Our suites feature premium bedding and elegant decor for the ultimate comfort.",
    },
    {
      src: "https://images.pexels.com/photos/4825701/pexels-photo-4825701.jpeg",
      alt: "Wine cellar",
      description:
        "Our extensive wine collection features rare vintages and local specialties.",
    },
    {
      src: "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg",
      alt: "Candlelit dinner",
      description:
        "Intimate dining experiences with personalized service and gourmet cuisine.",
    },
    {
      src: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg",
      alt: "Hotel facade night",
      description:
        "The elegant exterior of our resort illuminated against the evening sky.",
    },
    {
      src: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg",
      alt: "Breakfast spread",
      description:
        "Start your day with our gourmet breakfast selection featuring local delicacies.",
    },
    {
      src: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg",
      alt: "Lobby lounge",
      description:
        "Our welcoming lobby features comfortable seating areas and attentive service.",
    },
    {
      src: "https://images.pexels.com/photos/5491014/pexels-photo-5491014.jpeg",
      alt: "Cocktail crafting",
      description:
        "Watch our skilled bartenders craft signature cocktails using premium spirits and fresh ingredients.",
    },
  ];

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Create a larger 6x6 matrix with main diagonal and +1/-1 diagonals empty
  const createMatrix = () => {
    const size = 6;
    const matrix = [];
    let imageIndex = 0;

    for (let row = 0; row < size; row++) {
      const currentRow = [];
      for (let col = 0; col < size; col++) {
        // Check if position is on main diagonal or +1/-1 diagonals
        const isDiagonal = row === col || row === col + 1 || row === col - 1;

        if (isDiagonal) {
          currentRow.push({ isEmpty: true });
        } else if (imageIndex < galleryImages.length) {
          currentRow.push({
            isEmpty: false,
            image: galleryImages[imageIndex],
          });
          imageIndex++;
        } else {
          currentRow.push({ isEmpty: true });
        }
      }
      matrix.push(currentRow);
    }

    return matrix;
  };

  const matrix = createMatrix();

  return (
    <section
      className="relative pt-8 px-2 bg-black bg-cover bg-center min-h-screen"
      style={{
        backgroundImage: "url('/GalleryBack.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-white text-6xl font-light tracking-wider text-center mb-16">
          GALLERY
        </h2>

        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full mb-2">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-1/6 aspect-square px-1 ${
                  cell.isEmpty ? "opacity-0" : ""
                }`}
              >
                {!cell.isEmpty && cell.image && (
                  <div
                    className="relative w-full h-full overflow-hidden rounded-sm cursor-pointer shadow-md"
                    onClick={() => handleImageClick(cell.image)}
                  >
                    <img
                      src={cell.image.src}
                      alt={cell.image.alt}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-gray-900 text-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 md:h-96">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                {selectedImage.alt}
              </h3>
              <p className="text-gray-300">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
      <section className="relative ">
        <BookingSection />
      </section>
      <section className="relative   rounded-t-2xl">
        <Footer />
      </section>
    </section>
  );
}
