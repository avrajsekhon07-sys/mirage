/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mirage: {
          bg:          '#050505',
          surface:     '#0A0A0A',
          card:        '#0D0D0D',
          border:      '#1A1A1A',
          'border-hi': '#252525',
          accent:      '#00FF94',
          'accent-dim':'#00CC75',
          danger:      '#FF3333',
          warning:     '#FFB800',
          success:     '#00FF94',
          text:        '#FFFFFF',
          'text-dim':  '#888888',
          muted:       '#444444',
          dim:         '#222222',
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
