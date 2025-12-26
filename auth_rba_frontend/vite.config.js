import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';


// https://vitejs.dev/config/
export default defineConfig({
 plugins: [vue()],
 server: {
   // Ensure the frontend runs on a different port than your FastAPI backend (8000)
   port: 3000,
   // Host 0.0.0.0 is often needed for access across networks/containers
   host: '0.0.0.0',
 },
 // Ensure the base directory is correctly set for public assets
 base: '/',
});