/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system SIGP institutionnel
        navy: {
          900: '#0F1629',
          800: '#1A2640',
          700: '#1E2E4A',
          600: '#243556',
          500: '#2D3A52',
          400: '#3D4E68',
        },
        sigp: {
          blue: '#2563EB',
          'blue-light': '#3B82F6',
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          text: '#E2E8F0',
          muted: '#94A3B8',
          border: '#2D3A52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '0.65rem',
        xs: '0.75rem',
        sm: '0.813rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
