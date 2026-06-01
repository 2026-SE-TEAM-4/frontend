import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// @ 별칭은 src 루트를 가리킨다(shadcn/ui 규약과 동일). dev 서버 포트는 5173.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173 },
});
