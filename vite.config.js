import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), tailwindcss()],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) so mobile devices on the same Wi-Fi can connect
    port: 5173,
  },
})
