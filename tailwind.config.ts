import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "custom-yellow": "#fac763",
        "custom-ticket": "#acacac",
        "custom-light-gray": "#f7f7f7",
        "custom-gray": "#d1d1d1",
        "custom-gray-sec": "#c6c6c6",
        "custom-text-color": "#4a4948",
        "custom-booked-gray": "#e5e5e5",
      },
    },
  },
  plugins: [],
} satisfies Config;
