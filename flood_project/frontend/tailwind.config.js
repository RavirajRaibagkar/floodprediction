/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sentinel: {
                    50: '#eef8ff',
                    100: '#d8eeff',
                    200: '#b9e0ff',
                    300: '#89cfff',
                    400: '#52b4ff',
                    500: '#2a93ff',
                    600: '#0d6efd',
                    700: '#0d5ae0',
                    800: '#1249b6',
                    900: '#15408f',
                    950: '#112957',
                },
                flood: {
                    low: '#22c55e',
                    medium: '#f59e0b',
                    high: '#ef4444',
                    critical: '#991b1b',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(42, 147, 255, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(42, 147, 255, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
