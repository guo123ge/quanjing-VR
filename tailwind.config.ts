import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        porcelain: "#f8fafc",
        midnight: "#0f172a",
        slateLine: "#e2e8f0",
        aiPurple: "#8b5cf6",
        aiBlue: "#3b82f6",
        success: "#10b981",
        fern: "#10b981",
        clay: "#8b5cf6",
        brass: "#3b82f6",
      },
      boxShadow: {
        card: "0 4px 18px rgba(15, 23, 42, 0.06)",
        interactive: "0 18px 42px rgba(59, 130, 246, 0.14)",
        glass: "0 20px 60px rgba(15, 23, 42, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
