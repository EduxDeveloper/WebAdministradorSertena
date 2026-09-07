// Importamos defineConfig de Vite para tener autocompletado en la configuracion
import { defineConfig } from 'vite'
// Plugin de React para que Vite pueda compilar archivos JSX
import react from '@vitejs/plugin-react'
// Plugin de Tailwind CSS para procesarlo directamente desde Vite
import tailwindcss from '@tailwindcss/vite'

// Configuracion principal de Vite
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
