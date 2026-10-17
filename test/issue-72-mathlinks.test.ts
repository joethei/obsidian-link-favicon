import {describe, expect, it, vi} from "vitest";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType} from "@codemirror/view";
import {createEditor, createPlugin} from "./helpers";
import {IconWidget} from "../src/decoration/icon/IconWidget";

class MathLinkWidget extends WidgetType {
	constructor(readonly text: string) {
		super();
	}

	override eq(other: MathLinkWidget) {
		return other.text === this.text;
	}

	toDOM() {
		const span = document.createElement("span");
		span.className = "cm-hmd-internal-link mathlink";
		span.textContent = this.text;
		return span;
	}
}

function mathLinkDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	for (const match of view.state.doc.toString().matchAll(/\[([^\]]*)\]\([^)]*\)/g)) {
		const from = match.index ?? 0;
		builder.add(from, from + match[0].length, Decoration.widget({widget: new MathLinkWidget(match[1])}));
	}
	return builder.finish();
}

/**
 * what MathLinks (0.5.x) does in the editor: every `[text](url)` link outside the selection is
 * covered by a `Decoration.widget` from `[` to `)`, which renders the link text.
 * The widget starts at `[`, the same position the favicon is placed at.
 */
const mathLinks = ViewPlugin.fromClass(class {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = mathLinkDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) this.decorations = mathLinkDecorations(update.view);
	}
}, {decorations: value => value.decorations});

async function renderedIcons(view: EditorView): Promise<Element[]> {
	const toDOM = vi.spyOn(IconWidget.prototype, "toDOM");
	await new Promise(resolve => setTimeout(resolve, 50));
	//icons of widgets inside a replaced range are never drawn
	return toDOM.mock.results.map(result => result.value as Element).filter(el => view.contentDOM.contains(el));
}

describe("issue #72: favicons with MathLinks enabled", () => {
	it("shows the icon in front of an aliased link that MathLinks renders", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "a [Obsidian](https://obsidian.md) link", {extensions: [mathLinks]});

		const icons = await renderedIcons(view);

		expect(icons).toHaveLength(1);
		expect(icons[0].closest(".mathlink")).toBeNull();
		expect(view.contentDOM.querySelector(".mathlink")?.textContent).toBe("Obsidian");
	});

	it("shows the icon for a link with math in its text", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "$x^2$ and [Link with $x^2$ math](https://en.wikipedia.org)", {extensions: [mathLinks]});

		expect(await renderedIcons(view)).toHaveLength(1);
	});

	it("still shows the icon for autolinks next to it", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "see <https://obsidian.md> and [GitHub](https://github.com)", {extensions: [mathLinks]});

		expect(await renderedIcons(view)).toHaveLength(2);
	});

	it("shows the icon without MathLinks", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "a [Obsidian](https://obsidian.md) link");

		expect(await renderedIcons(view)).toHaveLength(1);
	});
});
