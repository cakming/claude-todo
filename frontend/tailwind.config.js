/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'status-planning': '#6B7280',
        'status-todo': '#3B82F6',
        'status-in-progress': '#F59E0B',
        'status-done': '#10B981',
        'status-blocked': '#EF4444',
      }
    },
  },
  plugins: [],
}
