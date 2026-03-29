import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import path from "path";

const projectRoot = path.resolve(__dirname);

const config: Config = {
  content: [
    path.join(projectRoot, "./pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        black: "#0C0C0A",
        black2: "#111110",
        gray: "#1E1E1C",
        gray2: "#2A2A28",
        yellow: "#F5C400",
        yellow2: "#D4A800",
        cream: "#F2EEE6",
        muted: "#888880",
      },
      fontFamily: {
        condensed: ["var(--font-barlow-condensed)", "sans-serif"],
        sans: ["var(--font-barlow)", "sans-serif"],
      },
      keyframes: {
        drift: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(122px)" },
        },
        "spin-slow": {
          from: { transform: "translateY(-50%) rotate(0deg)" },
          to: { transform: "translateY(-50%) rotate(360deg)" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        drift: "drift 18s linear infinite",
        "spin-slow": "spin-slow 44s linear infinite",
        ticker: "ticker 30s linear infinite",
        fadeup: "fadeup 0.9s forwards",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".text-outline": {
          "-webkit-text-stroke": "2px #F2EEE6",
          color: "transparent",
        },
      });
    }),
  ],
};
export default config;
