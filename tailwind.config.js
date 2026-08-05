/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: '#27ae60',
        'emerald-muted': '#1b7d44',
        mint: '#ebf7ed',
        forest: '#1e8449',
        paper: '#FDFDFD',
        slate: {
          400: '#94a3b8',
          500: '#64748b',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Recursive', 'system-ui', 'sans-serif'],
        mono: ['Recursive', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
