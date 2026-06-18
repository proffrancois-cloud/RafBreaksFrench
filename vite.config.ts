import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

const repositoryName = "RafBreaksFrench";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : "/",
  plugins: [react()],
});
