
import type { Config } from "tailwindcss";

export default {
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
				tertiary: {
					DEFAULT: 'hsl(var(--tertiary))',
					foreground: 'hsl(var(--tertiary-foreground))'
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
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Corporate HR/Enterprise Color System
				'corporate-blue': {
					DEFAULT: 'hsl(var(--corporate-blue))',
					light: 'hsl(var(--corporate-blue-light))'
				},
				'corporate-green': {
					DEFAULT: 'hsl(var(--corporate-green))',
					light: 'hsl(var(--corporate-green-light))'
				},
				'corporate-orange': {
					DEFAULT: 'hsl(var(--corporate-orange))',
					light: 'hsl(var(--corporate-orange-light))'
				},
				'corporate-gray': {
					50: 'hsl(var(--corporate-gray-50))',
					100: 'hsl(var(--corporate-gray-100))',
					200: 'hsl(var(--corporate-gray-200))',
					300: 'hsl(var(--corporate-gray-300))',
					400: 'hsl(var(--corporate-gray-400))',
					500: 'hsl(var(--corporate-gray-500))',
					600: 'hsl(var(--corporate-gray-600))',
					700: 'hsl(var(--corporate-gray-700))',
					800: 'hsl(var(--corporate-gray-800))',
					900: 'hsl(var(--corporate-gray-900))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'sans': ['Inter', 'system-ui', 'sans-serif']
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
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			boxShadow: {
				'corporate': '0 1px 3px 0 hsl(210 14% 83% / 0.1), 0 1px 2px -1px hsl(210 14% 83% / 0.1)',
				'corporate-lg': '0 10px 15px -3px hsl(210 14% 83% / 0.1), 0 4px 6px -4px hsl(210 14% 83% / 0.1)'
			},
			backgroundImage: {
				'corporate-gradient': 'linear-gradient(135deg, hsl(var(--corporate-blue)) 0%, hsl(var(--corporate-green)) 100%)',
				'corporate-gradient-subtle': 'linear-gradient(135deg, hsl(var(--corporate-blue-light)) 0%, hsl(var(--corporate-green-light)) 100%)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
