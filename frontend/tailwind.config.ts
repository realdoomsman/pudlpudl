import type { Config } from 'tailwindcss'

// PUDL adopts the Elegans design system verbatim: pure-black chrome, ONE acid
// accent (acid yellow #e8ff1e), sharp 2px edges, solid + dashed hairlines,
// uppercase mono labels. Data-only colours (motor red / interneuron blue /
// sensory orange) never touch chrome. Nothing glows.
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        surface: '#080808',
        surface2: '#0e0e0e',
        sunk: '#0e0e0e',
        line: '#1c1c1c',
        line2: 'rgba(255,255,255,0.10)',
        dash: 'rgba(255,255,255,0.13)',
        acid: '#e8ff1e', // the one accent
        acidink: '#0a0a00',
        acidhover: '#f2ff5c',
        // data semantics — never used on chrome
        motor: '#ff5a7a',
        interneuron: '#5ad1ff',
        sensory: '#ffb347',
        // aliases kept for components that still reference the old names
        gold: '#ffb347', // boost = sensory orange
        danger: '#ff5a7a', // = motor
        flood: '#5ad1ff', // = interneuron
        hair: '#1c1c1c', // = line (border-hair -> solid Elegans line)
        abyss: '#000000',
        deep: '#080808',
        deeper: '#0e0e0e',
        pudl: {
          green: '#e8ff1e',
          dark: '#000000',
          gray: { 500: '#737373', 600: '#525252', 700: '#404040', 800: '#141414', 900: '#0a0a0a' },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '2px', sm: '2px', md: '2px', lg: '2px', xl: '2px', '2xl': '2px', '3xl': '2px' },
      letterSpacing: { label: '0.2em' },
      keyframes: {
        shimmer: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { shimmer: 'shimmer 2s ease-in-out infinite', rise: 'rise .5s ease-out both' },
    },
  },
  plugins: [],
}
export default config
