import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ===== NEW DESIGN SYSTEM =====
      colors: {
        // Original colors (kept as requested)
        primary: "#0D0D0D", // Deep Charcoal Black
        secondary: "#F5F5F5", // Soft Warm White
        accent1: "#FFD700", // Subtle Gold
        accent2: "#00BFA6", // Teal Green
        error: "#FF4D4D", // Gentle Coral Red
        textDark: "#1C1C1C", // Primary text on light bg
        textLight: "#9A9A9A", // Secondary text on dark bg
        accent: "#FFD700",
        "accent-foreground": "#0D0D0D",
      },
      // Typography Scale
      fontSize: {
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.5", fontWeight: "400" }],
        h3: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        h1: ["32px", { lineHeight: "1.3", fontWeight: "600" }],
        display: ["40px", { lineHeight: "1.2", fontWeight: "700" }],
        hero: ["56px", { lineHeight: "1.2", fontWeight: "700" }],
      },
      // Spacing Scale
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      // Shadow System
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.05)",
        sm: "0 2px 4px rgba(0,0,0,0.1)",
        md: "0 4px 12px rgba(0,0,0,0.15)",
        lg: "0 8px 20px rgba(0,0,0,0.2)",
        xl: "0 12px 32px rgba(0,0,0,0.25)",
        // Colored Shadows (Premium Glow)
        "glow-primary": "0 4px 12px rgba(168,230,207,0.3)",
        "glow-secondary": "0 4px 12px rgba(139,122,184,0.3)",
        "glow-accent": "0 4px 12px rgba(255,217,61,0.3)",
      },
      // Border Radius
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      // Background Gradients (via backgroundImage)
      backgroundImage: {
        "gradient-mint": "linear-gradient(135deg, #A8E6CF 0%, #DCFCE7 100%)",
        "gradient-purple": "linear-gradient(135deg, #8B7AB8 0%, #C4B5E8 100%)",
        "gradient-warm": "linear-gradient(135deg, #FFD93D 0%, #FFA500 100%)",
        "gradient-cool": "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
        "gradient-pink": "linear-gradient(135deg, #FFB3D9 0%, #FFC8DD 100%)",
        "gradient-blue": "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
        "gradient-red": "linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "50%": { opacity: ".5" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        ringFill: {
          from: { strokeDashoffset: "100" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "ring-fill": "ringFill 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
} satisfies Config;

export default config;
