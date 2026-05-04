/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — your blue stays
        brand: {
          50:  '#e8f4fd',
          100: '#c5e4fa',
          200: '#9dd0f7',
          300: '#6db8f2',
          400: '#85C7F2', // primary
          500: '#4aaee8',
          600: '#2191d4',
          700: '#1571a8',
          800: '#0f527a',
          900: '#093650',
        },
        // Violet energy accent
        violet: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Blue-tinted dark surfaces (Linear/Vercel flavour)
        surface: {
          base:   '#060a10',   // deepest bg
          page:   '#080d14',   // page bg
          1:      '#0c1220',   // card level 1
          2:      '#101829',   // card level 2
          3:      '#141e30',   // elevated
          4:      '#1a2540',   // hover state
          border: '#1e2d47',   // default border
          glow:   '#1d3a5f',   // glowing border
        },
        // Text
        ink: {
          primary:   '#e8edf5',
          secondary: '#8896ae',
          tertiary:  '#4e5f7a',
          muted:     '#2d3d55',
        },
        // Semantic — keeping solid colours only
        success: '#22c55e',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
      },
      fontFamily: {
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow-xs': '0 0 10px rgba(133,199,242,0.1)',
        'glow-sm': '0 0 20px rgba(133,199,242,0.15)',
        'glow-md': '0 0 40px rgba(133,199,242,0.18)',
        'glow-lg': '0 0 80px rgba(133,199,242,0.2)',
        'violet-glow': '0 0 30px rgba(139,92,246,0.2)',
        'surface': '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
        'float':   '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)',
        'card':    '0 0 0 1px rgba(30,45,71,0.8), 0 4px 24px rgba(0,0,0,0.35)',
        'input-focus': '0 0 0 3px rgba(133,199,242,0.12)',
      },
      animation: {
        'shimmer':     'shimmer 2.5s linear infinite',
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
        'float':       'float 5s ease-in-out infinite',
        'scan':        'scan 4s linear infinite',
        'fade-in':     'fadeIn 0.4s ease forwards',
        'slide-up':    'slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'gradient-x':  'gradientX 6s ease infinite',
        'orbit':       'orbit 12s linear infinite',
      },
      keyframes: {
        shimmer:    { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        pulseGlow:  { '0%,100%': { opacity: '0.5', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.05)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        scan:       { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        gradientX:  { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        orbit:      { from: { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' }, to: { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' } },
      },
    },
  },
  plugins: [],
}
