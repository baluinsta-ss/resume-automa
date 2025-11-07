import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-assets",
      apply: "build",
      enforce: "post",
      generateBundle() {
        // This hook runs after bundle generation
      },
      writeBundle() {
        // Create dist/extension directory if it doesn't exist
        const distDir = path.resolve(__dirname, "dist/extension");
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest.json
        const manifestSrc = path.resolve(__dirname, "public/manifest.json");
        const manifestDest = path.resolve(distDir, "manifest.json");
        if (fs.existsSync(manifestSrc)) {
          fs.copyFileSync(manifestSrc, manifestDest);
          console.log("✓ Copied manifest.json");
        }

        // Copy popup.html
        const popupSrc = path.resolve(__dirname, "client/extension/popup.html");
        const popupDest = path.resolve(distDir, "popup.html");
        if (fs.existsSync(popupSrc)) {
          fs.copyFileSync(popupSrc, popupDest);
          console.log("✓ Copied popup.html");
        }

        // Copy favicon.ico
        const faviconSrc = path.resolve(__dirname, "public/favicon.ico");
        const faviconDest = path.resolve(distDir, "favicon.ico");
        if (fs.existsSync(faviconSrc)) {
          fs.copyFileSync(faviconSrc, faviconDest);
          console.log("✓ Copied favicon.ico");
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: "dist/extension",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, "client/extension/background.ts"),
        content: path.resolve(__dirname, "client/extension/content.ts"),
        popup: path.resolve(__dirname, "client/extension/popup.ts"),
      },
      output: {
        dir: "dist/extension",
        entryFileNames: "[name].js",
        format: "iife",
        inlineDynamicImports: false,
      },
    },
    minify: "terser",
  },
});
