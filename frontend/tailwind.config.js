/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        yowon: {
          bg: '#050816',
          surface: '#0B1023',
          card: '#111827',
          border: '#1E2A44',
          primary: '#00E5FF',
          secondary: '#00FFA3',
          accent: '#7C3AED',
          teal: '#00FFA3',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#94A3B8',
          text: '#F8FAFC',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E2A44' fill-opacity='0.5'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'aurora-radial':
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,229,255,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 85% 10%, rgba(0,255,163,0.12), transparent 50%), radial-gradient(ellipse 50% 35% at 50% 100%, rgba(124,58,237,0.16), transparent 55%)',
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(124, 58, 237, 0.35)',
        'glow-rose': '0 0 24px rgba(0, 229, 255, 0.3)',
        'glow-amber': '0 0 24px rgba(0, 255, 163, 0.25)',
      },
    },
  },
  plugins: [],
}
