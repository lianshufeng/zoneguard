import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: source("./src"),
  publicDir: source("./public"),
  build: {
    outDir: source("./dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "background/serviceWorker": source("./src/background/serviceWorker.ts"),
        "popup/popup": source("./src/popup/popup.html"),
        "options/options": source("./src/options/options.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
