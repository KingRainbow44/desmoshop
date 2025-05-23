import tsconfigPaths from "vite-tsconfig-paths";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import manifest from "./manifest.json";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        crx({ manifest }),
        tailwindcss()
    ],
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    }
});