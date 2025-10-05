import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable manual dark mode toggle
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base Palette
        'uc-black': '#1E1E1E', 
        'uc-dark-bg': '#382740',
        'uc-purple': '#6A1B9A',
        'uc-mustard': '#FFC107', 
        'uc-text-light': '#F5F5F5',
        'uc-text-muted': '#C7A256',
        
        // Semantic Colors
        'uc-success': '#5D7B5C',
        'uc-alert': '#A83F2F',
        
        // Training type colors - updated to match new palette
        training: {
          gym: '#7C2D12',      // Red-900
          bouldering: '#DC2626', // Red-600
          circuits: '#EA580C',   // Orange-600
          leadRock: '#D97706',   // Amber-600
          leadArtificial: '#059669', // Emerald-600
          mentalPractice: '#7C3AED', // Violet-600
        }
      },
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}
export default config
