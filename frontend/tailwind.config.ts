import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "1.75rem",
        xl: "2rem",
      },
      screens: {
        "2xl": "1240px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#FFFFFF",
        ink: "#0f172a",
      },
      boxShadow: {
        soft: "0 24px 60px -28px rgb(15 23 42 / 0.2)",
        card: "0 20px 45px -24px rgb(15 23 42 / 0.2)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.35)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

