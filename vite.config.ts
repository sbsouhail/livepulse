import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/client/index.ts",
			name: "LivePulse",
			fileName: (format) => `livepulse.${format}.js`,
			formats: ["iife"],
		},
		outDir: "dist/client",
		emptyOutDir: true,
		minify: true,
	},
});
