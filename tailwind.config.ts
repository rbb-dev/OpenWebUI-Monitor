import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-in-delay": "fadeIn 0.6s ease-out 0.2s forwards",
      },
    },
  },
  plugins: [],
};

export default config;
