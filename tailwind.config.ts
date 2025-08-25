import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-right": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        "ticker-left": "ticker-left 30s linear infinite",
        "ticker-right": "ticker-right 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;


