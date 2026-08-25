import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0f172a",
          800: "#1e3a8a",
          700: "#1d4ed8",
        },
        indigo: {
          600: "#4f46e5",
          500: "#6366f1",
        },
        emerald: {
          500: "#10b981",
          600: "#059669",
        },
        gold: {
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      boxShadow: {
        "3d-light": "0 10px 30px -10px rgba(30, 58, 138, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "3d-card": "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)",
        "3d-button": "0 4px 0 0 #0f172a, 0 10px 15px -3px rgba(0, 0, 0, 0.2)",
        "glow-emerald": "0 0 25px rgba(16, 185, 129, 0.6)",
        "glow-indigo": "0 0 30px rgba(79, 70, 229, 0.6)",
        "glow-gold": "0 0 20px rgba(245, 158, 11, 0.5)",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "float": "float 4s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)" },
          "50%": { transform: "scale(1.08)", boxShadow: "0 0 40px rgba(79, 70, 229, 0.8), 0 0 60px rgba(16, 185, 129, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
