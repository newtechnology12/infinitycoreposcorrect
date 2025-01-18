// filepath: /c:/Users/user/Music/Infinityposs/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },  
  build: {
    outDir: "dist",  
    sourcemap: process.env.NODE_ENV !== "production", 
    chunkSizeWarningLimit: 1600, 
  },
  
});