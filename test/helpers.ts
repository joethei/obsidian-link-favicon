import {vi} from "vitest";
import {EditorState} from "@codemirror/state";
import {EditorView} from "@codemirror/view";
import {markdown, markdownLanguage} from "@codemirror/lang-markdown";
import {editorLivePreviewField, MarkdownPostProcessorContext} from "obsidian";
import FaviconPlugin from "../src/main";
import {DEFAULT_SETTINGS, FaviconPluginSettings} from "../src/settings";
import {IconAdder} from "../src/IconAdder";
import {PostProcessor} from "../src/PostProcessor";
import {asyncDecoBuilderExt, iconDecorations} from "../src/decoration/icon/IconDecorations";

export interface FakePluginOptions {
	settings?: Partial<FaviconPluginSettings>;
	/** community plugins by id, e.g. `{"obsidian-icon-shortcodes": {api}}` */
	plugins?: Record<string, unknown>;
}

/**
 * builds a FaviconPlugin without running `onload`,
 * with just enough of `app` for getIcon, the IconAdder and the PostProcessor.
 */
export function createPlugin(options: FakePluginOptions = {}): FaviconPlugin {
	const app = {
		plugins: {plugins: options.plugins ?? {}},
		vault: {configDir: ".obsidian"},
		workspace: {updateOptions: vi.fn(), on: vi.fn()},
	};
	const plugin = new FaviconPlugin(app as never, {id: "link-favicon"} as never);
	plugin.settings = {...DEFAULT_SETTINGS, debounce: 0, ...options.settings};
	plugin.iconAdder = new IconAdder(plugin);
	return plugin;
}

/**
 * runs the reading view post processor over `html`, like Obsidian does for a rendered section,
 * and waits until all links are processed.
 */
export async function renderReading(plugin: FaviconPlugin, html: string, context: Partial<MarkdownPostProcessorContext> = {}): Promise<HTMLElement> {
	const el = document.createElement("div");
	el.innerHTML = html;
	document.body.appendChild(el);

	vi.useFakeTimers();
	try {
		await new PostProcessor(plugin).processor(el, {sourcePath: "note.md", frontmatter: undefined, ...context} as MarkdownPostProcessorContext);
		await vi.runAllTimersAsync();
	} finally {
		vi.useRealTimers();
	}
	return el;
}

/** an external link as Obsidian renders `[text](href)` in reading view */
export function externalLink(href: string, text = href): string {
	return `<a class="external-link" href="${href}" target="_blank" rel="noopener nofollow">${text}</a>`;
}

/**
 * an editor with the plugin's icon decorations. The syntax tree comes from @codemirror/lang-markdown,
 * which names link targets `URL` like Obsidian's parser does, but can differ in the details.
 * `gfm` parses GitHub flavored markdown, which links bare URLs and emails like Obsidian does.
 */
export function createEditor(plugin: FaviconPlugin, doc: string, options: {livePreview?: boolean, gfm?: boolean} = {}): EditorView {
	const parent = document.createElement("div");
	document.body.appendChild(parent);
	return new EditorView({
		parent,
		state: EditorState.create({
			doc,
			extensions: [
				options.gfm ? markdown({base: markdownLanguage}) : markdown(),
				editorLivePreviewField.init(() => options.livePreview ?? true),
				asyncDecoBuilderExt(plugin),
			],
		}),
	});
}

/**
 * waits for the debounced, async icon decorations and returns where they were placed,
 * with the domain (or protocol) each icon is for.
 */
export async function iconDecorationsOf(view: EditorView, waitMs = 50): Promise<{from: number, qualifier: string}[]> {
	await new Promise(resolve => setTimeout(resolve, waitMs));
	const result: {from: number, qualifier: string}[] = [];
	view.state.field(iconDecorations.field).between(0, view.state.doc.length, (from, _to, deco) => {
		const widget = (deco.spec as {widget?: {qualifier: string}}).widget;
		result.push({from, qualifier: widget?.qualifier ?? ""});
	});
	return result;
}
