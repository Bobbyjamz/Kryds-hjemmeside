import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import path from "path";

const projectRoot = path.resolve(__dirname);

const config: Config = {
  content: [
    path.join(projectRoot, "./pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "./contexts/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        // All colors use CSS variables — they automatically adapt to dark/light theme
        black:   "var(--color-black)",
        black2:  "var(--color-black2)",
        gray:    "var(--color-gray)",
        gray2:   "var(--color-gray2)",
        yellow:  "var(--color-yellow)",
        yellow2: "var(--color-yellow2)",
        cream:   "var(--color-cream)",
        muted:   "var(--color-muted)",
      },
      fontFamily: {
        condensed: ["var(--font-barlow-condensed)", "sans-serif"],
        sans:      ["var(--font-barlow)", "sans-serif"],
      },
      keyframes: {
        drift: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(122px)" },
        },
        "spin-slow": {
          from: { transform: "translateY(-50%) rotate(0deg)" },
          to:   { transform: "translateY(-50%) rotate(360deg)" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
      animation: {
        drift:       "drift 18s linear infinite",
        "spin-slow": "spin-slow 44s linear infinite",
        ticker:      "ticker 30s linear infinite",
        fadeup:      "fadeup 0.9s forwards",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".text-outline": {
          "-webkit-text-stroke": "2px var(--color-cream)",
          color: "transparent",
        },
      });
    }),
  ],
};

export default config;
