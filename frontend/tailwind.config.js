/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          700: '#334155',
          800: '#1e293b',
          850: '#172032',
          900: '#0f172a',
          950: '#080d17',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #080d17 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(15,23,42,0) 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'scanner':    'scanner 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow:      { from: { boxShadow: '0 0 5px rgba(99,102,241,0.3)' }, to: { boxShadow: '0 0 20px rgba(99,102,241,0.7)' } },
        scanner:   {
          '0%,100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%':     { transform: 'translateY(280px)', opacity: '0.4' },
        },
      },
      boxShadow: {
        'brand':  '0 0 20px rgba(99,102,241,0.35)',
        'glow':   '0 0 30px rgba(99,102,241,0.5)',
        'card':   '0 4px 24px rgba(0,0,0,0.3)',
        'inner-brand': 'inset 0 1px 0 rgba(99,102,241,0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
