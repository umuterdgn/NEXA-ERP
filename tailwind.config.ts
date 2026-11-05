/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        tenant: 'var(--tenant-primary, #3B82F6)',
        mono: {
          bg: '#000000',
          card: '#121212',
          border: '#ffffff',
          text: '#ffffff',
          muted: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
}
