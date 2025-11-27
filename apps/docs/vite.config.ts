import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The docs render the registry source directly (no copy step) so they always
// show exactly what `slateui add` would install.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\/(.*)$/, replacement: r("../../registry/ui/$1") },
      { find: /^@\/lib\/(.*)$/, replacement: r("../../registry/lib/$1") },
    ],
    dedupe: ["react", "react-dom"],
  },
  build: { chunkSizeWarningLimit: 1000 },
});
