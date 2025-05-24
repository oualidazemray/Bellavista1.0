// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        seasons: ["TheSeasons", "sans-serif"], // fallback to sans-serif
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
