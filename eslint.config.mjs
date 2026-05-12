import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default defineConfig([
	{
		ignores: ["coverage/**", "npm/**", "node_modules/**", "build/**", "*.config.js", "*.config.mjs"],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				sourceType: "module",
			},
		},
		plugins: {
			obsidianmd,
		},
		rules: {
			"no-prototype-builtins": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"obsidianmd/sample-names": "off",
			"obsidianmd/prefer-file-manager-trash": "error",
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
