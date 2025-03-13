/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#D4AF37',
        'brand-black': '#0D0D0D',
        'brand-grey': '#2A2A2A',
        'brand-navy': '#020A18',
      },
      fontFamily: {
        'bank-gothic': ['Bank Gothic', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'eurostile': ['Eurostile Extended', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
} 