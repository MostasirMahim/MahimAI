/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: { max: "639px" }, // Below sm (for mobile screens)
      },
      fontFamily: {
        kaushan: ["Kaushan Script", "cursive"],
        spartan: ["League Spartan", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui"), require("tailwind-scrollbar")],
};
