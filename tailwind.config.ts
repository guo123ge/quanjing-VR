import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        porcelain: "#f6f3ee",
        fern: "#5f7f68",
        clay: "#b86f52",
        brass: "#b78d43",
      },
    },
  },
  plugins: [],
};

export default config;
