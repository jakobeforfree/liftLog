/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Loads .env.local so integration tests reach the same Supabase project as the app.
    env: loadEnv("development", process.cwd(), "NEXT_PUBLIC_"),
  },
});
