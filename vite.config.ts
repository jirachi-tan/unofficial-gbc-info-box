
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const buildTimestamp = String(Date.now());

/** Emit build-meta.json into dist/ so the app can poll for new versions. */
function buildMetaPlugin(): Plugin {
  return {
    name: "build-meta",
    writeBundle({ dir }) {
      const outDir = dir ?? resolve(__dirname, "dist");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        resolve(outDir, "build-meta.json"),
        JSON.stringify({ buildTime: buildTimestamp }) + "\n",
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), buildMetaPlugin()],
  base: "/unofficial-gbc-info-box/",
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
});
