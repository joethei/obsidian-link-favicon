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
		files: ["test/**/*.ts"],
		languageOptions: {
			globals: {
				afterEach: "readonly",
				beforeEach: "readonly",
				describe: "readonly",
				expect: "readonly",
				jest: "readonly",
				test: "readonly",
			},
		},
	},
]);
