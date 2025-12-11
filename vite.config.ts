import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env variables for this mode
  const env = loadEnv(mode, process.cwd(), "");

  // Read from env; fallback to a local default
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:8000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxyTarget.startsWith("https://"),
        },
      },
    },
  };
});
