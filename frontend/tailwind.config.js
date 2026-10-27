/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111827",
        surfaceHover: "#1f293d",
        card: "rgba(17, 24, 39, 0.7)",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          glowing: "#818cf8"
        },
        secondary: "#10b981",
        accent: "#f43f5e",
        textMuted: "#9ca3af"
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite",
        "float": "float 3s ease-in-out infinite"
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 1, filter: "drop-shadow(0 0 15px rgba(99, 102, 241, 0.6))" },
          "50%": { opacity: 0.7, filter: "drop-shadow(0 0 5px rgba(99, 102, 241, 0.2))" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      }
    },
  },
  plugins: [],
};
