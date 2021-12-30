import esbuild from "esbuild";
import process from "process";
import builtins from 'builtin-modules';

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
https://github.com/joethei/obisidian-link-favicon
*/
`;

const prod = (process.argv[2] === 'production');

esbuild.build({
	banner: {
		js: banner,
	},
	entryPoints: ['src/main.ts'],
	bundle: true,
	external: ['obsidian', 'electron', '@codemirror/language', '@codemirror/rangeset', '@codemirror/state', '@codemirror/stream-parser', '@codemirror/view', ...builtins],
	format: 'cjs',
	watch: !prod,
	target: 'es2016',
	logLevel: "info",
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	outfile: 'main.js',
}).catch(() => process.exit(1));
