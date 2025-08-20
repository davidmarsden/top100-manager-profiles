tailwind.config.jsexport default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}postcss.config.jsexport default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}