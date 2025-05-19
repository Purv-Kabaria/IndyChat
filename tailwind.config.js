// tailwind.config.js
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#14284b',    // Your main accent color
        secondary: '#ed1c24',  // Red color from your design
        accent: '#94d2bd',     // Teal color from your design
        dark: '#001219', 
        accent: '#14284b'      // Dark background color
      }
    },
  },
  plugins: [],
}