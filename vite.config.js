import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'acasa.html',
        menu: 'index.html',
        offer: 'oferta.html',
        admin: 'admin.html',
      }
    }
  }
})
