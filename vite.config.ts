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
    outDir: "dist", // Ensure this matches your expected output directory
    sourcemap: true, // Enable sourcemaps for debugging
    chunkSizeWarningLimit: 1600, // Increase the limit if needed
  },
});
