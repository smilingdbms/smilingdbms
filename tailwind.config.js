/** @type {import('tailwindcss').Config} */
module.exports = {
  // ─── FIXED: was missing pages/ — all Tailwind classes in pages were purged ───
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: 'var(--ac)', dark: 'var(--ac)' },
        surface: { DEFAULT: 'var(--bg2)', light: 'var(--bg3)', dark: 'var(--bg)' }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    }
  },
  plugins: []
}
