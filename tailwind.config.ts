import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Serif design system — paper & ink
        ink: {
          DEFAULT: "#2C2825",
          light: "#6B6560",
          muted: "#9C9590",
          faint: "#C4BFBA",
        },
        paper: {
          DEFAULT: "#FAFAF7",
          warm: "#F5F4F0",
          cool: "#FDFCFB",
        },
        // Functional accent — kept minimal
        serif: {
          success: "#3D7A4A",
          error: "#B5453A",
          warning: "#C4850A",
        },
        // Legacy leaf aliases (for gradual migration of dashboard pages)
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "warm-sm": "0 1px 3px rgba(44, 40, 37, 0.06)",
        "warm-md": "0 4px 12px rgba(44, 40, 37, 0.08)",
        "warm-lg": "0 8px 24px rgba(44, 40, 37, 0.10)",
      },
      borderColor: {
        DEFAULT: "rgba(44, 40, 37, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
