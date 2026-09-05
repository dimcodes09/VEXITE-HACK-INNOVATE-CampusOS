import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./models/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B"
        },
        obsidian: {
          950: "#06080B",
          900: "#0B0E14",
          850: "#10151E",
          800: "#161D2A",
          750: "#1C2536",
          700: "#243046",
          600: "#364660",
          border: "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.16)",
          "border-dim": "rgba(255, 255, 255, 0.04)"
        },
        risk: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#F59E0B",
          low: "#10B981",
          safe: "#059669"
        },
        telemetry: {
          cyan: "#0284C7",
          blue: "#2563EB",
          emerald: "#059669",
          amber: "#D97706",
          crimson: "#DC2626",
          purple: "#7C3AED"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanner": "scan 2.5s ease-in-out infinite",
        "radar-sweep": "radar 4s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      },
      keyframes: {
        scan: {
          "0%, 100%": { transform: "translateY(-100%)", opacity: "0" },
          "50%": { transform: "translateY(100%)", opacity: "1" }
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
};

export default config;
