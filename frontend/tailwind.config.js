/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mirage: {
          bg: '#080810',
          surface: '#0C0C1A',
          card: '#0D0D1B',
          border: '#1A1A2C',
          'border-hi': '#282838',
          accent: '#C9A84C',
          'accent-dim': '#8C723A',
          danger: '#DC2626',
          success: '#16A34A',
          warning: '#D97706',
          text: '#FFFFFF',
          'text-dim': '#9090A4',
          muted: '#5A5A6E',
          dim: '#3A3A4E',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
