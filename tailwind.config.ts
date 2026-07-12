import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        coal: "var(--color-coal)",
        smoke: "var(--color-smoke)",
        bone: "var(--color-bone)",
        brass: "var(--color-brass)",
        oxblood: "var(--color-oxblood)"
      },
      fontFamily: {
        display: ["Arial Narrow", "Impact", "sans-serif"],
        sans: ["Inter", "Noto Sans TC", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
