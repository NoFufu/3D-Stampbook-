import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' damit der Build auch unter einem Unterpfad (z. B. GitHub Pages) läuft
export default defineConfig({
  base: './',
  plugins: [react()]
});
