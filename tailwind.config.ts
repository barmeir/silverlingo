import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#4A148C",      // Primary Background / Framework (Trust & Calm)
          purpleDark: "#2A0854",  // High-contrast backdrop
          purpleLight: "#F5F0FA", // Soft surface for WCAG AAA dark-on-light reading
          orange: "#FF6D00",      // Exclusive Primary CTA color
          orangeHover: "#E65100",
        },
      },
      fontSize: {
        "elderly-body": ["1.125rem", { lineHeight: "1.75rem" }], // 18px min
        "elderly-lg": ["1.375rem", { lineHeight: "2rem" }],      // 22px
        "elderly-h2": ["1.75rem", { lineHeight: "2.25rem" }],    // 28px
        "elderly-h1": ["2.25rem", { lineHeight: "2.75rem" }],    // 36px
      },
      spacing: {
        "touch-min": "60px", // Minimum 60px touch target height
        "touch-gap": "24px", // Minimum 24px gap between interactive elements
      },
    },
  },
  plugins: [],
};

export default config;
