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
			fontFamily: {
				sans: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
				mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
			},
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
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				// Basic animations
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				
				// Modern 3D and depth animations
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(0deg) scale(1)',
						opacity: '0.6'
					},
					'33%': { 
						transform: 'translateY(-12px) rotate(120deg) scale(1.1)',
						opacity: '0.8'
					},
					'66%': { 
						transform: 'translateY(-6px) rotate(-120deg) scale(0.9)',
						opacity: '1'
					}
				},
				'float-gentle': {
					'0%, 100%': { 
						transform: 'translateY(0px) scale(1)',
						opacity: '0.7'
					},
					'50%': { 
						transform: 'translateY(-8px) scale(1.05)',
						opacity: '1'
					}
				},
				
				// Advanced gradient and glow effects
				'gradient-shift': {
					'0%, 100%': { 
						backgroundPosition: '0% 50%',
						backgroundSize: '200% 200%'
					},
					'50%': { 
						backgroundPosition: '100% 50%',
						backgroundSize: '250% 250%'
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)',
						filter: 'brightness(1)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)',
						filter: 'brightness(1.2)'
					}
				},
				
				// Micro-interactions and UI feedback
				'micro-bounce': {
					'0%, 100%': { 
						transform: 'translateY(0) scale(1)',
						animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
					},
					'50%': { 
						transform: 'translateY(-4px) scale(1.05)',
						animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
					}
				},
				'bounce-in': {
					'0%': {
						transform: 'scale(0.3) rotate(-10deg)',
						opacity: '0',
						filter: 'blur(4px)'
					},
					'50%': {
						transform: 'scale(1.1) rotate(5deg)',
						opacity: '0.8',
						filter: 'blur(0px)'
					},
					'70%': {
						transform: 'scale(0.95) rotate(-2deg)',
						opacity: '0.9'
					},
					'100%': {
						transform: 'scale(1) rotate(0deg)',
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				
				// Sophisticated slide animations
				'slide-in-up': {
					'0%': {
						transform: 'translateY(30px) scale(0.95)',
						opacity: '0',
						filter: 'blur(2px)'
					},
					'100%': {
						transform: 'translateY(0) scale(1)',
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				
				// Orbital and rotation effects
				'orbital': {
					'0%': {
						transform: 'rotate(0deg) translateX(25px) rotate(0deg) scale(1)',
						opacity: '0.3'
					},
					'25%': {
						opacity: '0.7',
						transform: 'rotate(90deg) translateX(30px) rotate(-90deg) scale(1.2)'
					},
					'50%': {
						opacity: '1',
						transform: 'rotate(180deg) translateX(25px) rotate(-180deg) scale(0.8)'
					},
					'75%': {
						opacity: '0.7',
						transform: 'rotate(270deg) translateX(30px) rotate(-270deg) scale(1.1)'
					},
					'100%': {
						transform: 'rotate(360deg) translateX(25px) rotate(-360deg) scale(1)',
						opacity: '0.3'
					}
				},
				'rotate-slow': {
					'0%': { 
						transform: 'rotate(0deg) scale(1)',
						opacity: '0.8'
					},
					'50%': {
						transform: 'rotate(180deg) scale(1.1)',
						opacity: '1'
					},
					'100%': { 
						transform: 'rotate(360deg) scale(1)',
						opacity: '0.8'
					}
				},
				
				// Shimmer and shine effects
				'shimmer': {
					'0%': {
						transform: 'translateX(-100%) skewX(-15deg)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(200%) skewX(-15deg)',
						opacity: '0'
					}
				}
			},
			animation: {
				// Basic animations
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				
				// Modern floating and movement
				'float': 'float 6s ease-in-out infinite',
				'float-gentle': 'float-gentle 4s ease-in-out infinite',
				'orbital': 'orbital 12s linear infinite',
				'rotate-slow': 'rotate-slow 10s linear infinite',
				
				// Advanced visual effects
				'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
				'shimmer': 'shimmer 2.5s ease-in-out infinite',
				
				// Micro-interactions
				'micro-bounce': 'micro-bounce 1.5s ease-in-out infinite',
				'bounce-in': 'bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'slide-in-up': 'slide-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
			},
			boxShadow: {
				'3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
				'4xl': '0 45px 100px -12px rgba(0, 0, 0, 0.35)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
