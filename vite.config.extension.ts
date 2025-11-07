import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-files",
      apply: "build",
      enforce: "post",
      writeBundle() {
        const distDir = "dist/extension";

        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest
        if (fs.existsSync("public/manifest.json")) {
          fs.copyFileSync("public/manifest.json", `${distDir}/manifest.json`);
          console.log("✓ manifest.json");
        }

        // Copy popup HTML
        if (fs.existsSync("client/extension/popup.html")) {
          fs.copyFileSync(
            "client/extension/popup.html",
            `${distDir}/popup.html`,
          );
          console.log("✓ popup.html");
        }

        // Copy favicon
        if (fs.existsSync("public/favicon.ico")) {
          fs.copyFileSync("public/favicon.ico", `${distDir}/favicon.ico`);
          console.log("✓ favicon.ico");
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    target: "esnext",
    outDir: "dist/extension",
    emptyOutDir: false,
    lib: {
      entry: {
        background: "client/extension/background.ts",
        content: "client/extension/content.ts",
        popup: "client/extension/popup.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {
        preserveModules: false,
        entryFileNames: "[name].js",
      },
    },
    minify: "terser",
  },
});
