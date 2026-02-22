import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // 👈 Fixes MIME type / white blank page issue
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
