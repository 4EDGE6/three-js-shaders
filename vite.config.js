import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import restart from "vite-plugin-restart";

export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  server: {
    host: true,
    open: !("SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env),
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "esnext",
  },
  plugins: [
    restart({ restart: ["../static/**"] }),
    glsl({ include: ["**/*.glsl", "**/*.vert", "**/*.frag"] }),
  ],
});
