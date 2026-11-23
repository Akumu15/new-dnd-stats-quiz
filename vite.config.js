import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base matches the GitHub Pages URL: https://akumu15.github.io/new-dnd-stats-quiz/
export default defineConfig({
  plugins: [react()],
  base: "/new-dnd-stats-quiz/",
});
