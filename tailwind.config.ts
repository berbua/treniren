import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Training type colors - using standard Tailwind colors
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
