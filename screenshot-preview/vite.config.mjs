import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: process.cwd(),
  plugins: [
    {
      name: "app-jsx-loader",
      enforce: "pre",
      async transform(code, id) {
        if (!id.includes("/app/") || !id.endsWith(".js")) return null;
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
        });
      },
    },
    react(),
  ],
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
});
