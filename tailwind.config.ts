import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: '#FF5941',
					foreground: '#FFFFFC'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				// Website theme colors
				ink: '#FFFFFC',
				paper: '#0C120C',
				brand: {
					100: '#FFEBE8',
					300: '#FF9B8D',
					500: '#FF5941',
					600: '#E64A35',
					700: '#CC3E2E',
					900: '#99261A'
				},
				neutral: {
					50: '#0C120C',
					100: '#1C221D',
					300: '#48504A',
					500: '#B4BAB5',
					700: '#ECEFED',
					800: '#F7F8F7',
					900: '#FFFFFC'
				},
				// Override Red to Brand Orange-Red globally
				red: {
					50: '#FFF0EE',
					100: '#FFEBE8',
					200: '#FFCFC9',
					300: '#FF9B8D',
					400: '#FF7A6E',
					500: '#FF5941',
					600: '#E64A35',
					700: '#CC3E2E',
					800: '#B82E20',
					900: '#99261A',
					950: '#661410'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'soft': '0 2px 16px rgba(0, 0, 0, 0.3)',
				'lift': '0 8px 32px rgba(0, 0, 0, 0.4)',
				'intense': '0 16px 48px rgba(0, 0, 0, 0.5)'
			},
			fontSize: {
				'display-xl': ['56px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
				'display-lg': ['44px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
				'display-md': ['32px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
				'display-sm': ['24px', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
				'heading-lg': ['20px', { lineHeight: '1.35' }],
				'heading-md': ['16px', { lineHeight: '1.4' }],
				'body-lg': ['16px', { lineHeight: '1.6' }],
				'body': ['15px', { lineHeight: '1.6' }],
				'body-sm': ['13px', { lineHeight: '1.5' }]
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				marquee: 'marquee 25s linear infinite',
				'fade-in': 'fadeIn 0.6s ease-out forwards',
				'slide-up': 'slideUp 0.6s ease-out forwards'
			},
			fontFamily: {
				display: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
				sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
				cursive: ['Allura', 'Brush Script MT', 'cursive']
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
export default config;
