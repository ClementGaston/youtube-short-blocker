import { defineConfig } from "vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				blocker: resolve(__dirname, "src/scripts/blocker.ts"),
			},
			output: {
				entryFileNames: "blocker.js",
				format: "iife",
			},
		},
		emptyOutDir: false,
	},
});
