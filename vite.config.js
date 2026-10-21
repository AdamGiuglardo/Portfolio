import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(import.meta.dirname, "src"),
  base: "/Portfolio/",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  publicDir: false,
  server: {
    fs: { allow: [resolve(import.meta.dirname)] },
  },
  build: {
    minify: "oxc",
    lib: {
      entry: resolve(import.meta.dirname, "src/main.jsx"),
      formats: ["es"],
      fileName: () => "portfolio-react.js",
      cssFileName: "portfolio-react",
    },
    outDir: resolve(import.meta.dirname, "react-build"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
      },
    },
  },
});
