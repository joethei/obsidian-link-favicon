import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default defineConfig([
	{
		ignores: ["coverage/**", "npm/**", "node_modules/**", "build/**", "*.config.js", "*.config.mjs"],
	},
	...obsidianmd.configs.recommended.slice(0, -2),
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: "./tsconfig.json",
				sourceType: "module",
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				require: "readonly",
			},
		},
	},
	{
		//tests run in node + jsdom, not in an Obsidian window
		files: ["test/**/*.ts", "vitest.config.ts"],
		rules: {
			"no-undef": "off",
			"no-restricted-globals": "off",
			"import/no-nodejs-modules": "off",
			"obsidianmd/prefer-window-timers": "off",
			"obsidianmd/prefer-active-doc": "off",
			"obsidianmd/prefer-instanceof": "off",
			"obsidianmd/no-global-this": "off",
			"obsidianmd/hardcoded-config-path": "off",
			//fixtures are built from html strings
			"no-unsanitized/property": "off",
			"@microsoft/sdl/no-inner-html": "off",
		},
	},
]);
