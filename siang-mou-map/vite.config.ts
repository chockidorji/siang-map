import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Repo is served at https://chockidorji.github.io/siang-map/ via GitHub
  // Pages. Vite uses this prefix for built asset URLs and exposes it as
  // import.meta.env.BASE_URL for runtime fetches (see DistrictMap.tsx).
  base: '/siang-map/',
  plugins: [react(), tailwindcss()],
})
