import {defineConfig} from "vitest/config";
import {fileURLToPath} from "url";

export default defineConfig({
	resolve: {
		//@codemirror/language brings its own @codemirror/state, but Obsidian (and the plugin bundle) have a single copy
		dedupe: ["@codemirror/state", "@codemirror/view"],
		alias: {
			obsidian: fileURLToPath(new URL("./test/mocks/obsidian.ts", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		include: ["test/**/*.test.ts"],
		setupFiles: ["test/setup.ts"],
		server: {
			deps: {
				//these go through vite, so that the alias and dedupe above apply to them
				inline: ["@aidenlx/obsidian-icon-shortcodes", /@codemirror\//, /@lezer\//],
			},
		},
	},
});
