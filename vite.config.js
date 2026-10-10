import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        menu: 'meniu.html',
        offer: 'oferta.html',
        admin: 'admin.html',
      }
    }
  }
})
