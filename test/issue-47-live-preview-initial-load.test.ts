import {afterEach, describe, expect, it, vi} from "vitest";
import {EditorView} from "@codemirror/view";
import {syntaxTree} from "@codemirror/language";
import {createEditor, createPlugin, iconDecorationsOf} from "./helpers";

//far longer than the part of the document CodeMirror parses when the editor is created
const filler = Array.from({length: 2000}, (_, i) => `line ${i} of text without any link`).join("\n");
const doc = filler + "\n\n[Obsidian](https://obsidian.md) and [GitHub](https://github.com)\n";

/** jsdom has no layout, so pretend the editor opens scrolled to the end of the note, like in the issue */
function showEndOfDocument() {
	vi.spyOn(EditorView.prototype, "visibleRanges", "get").mockImplementation(function (this: EditorView) {
		return [{from: this.state.doc.length - 200, to: this.state.doc.length}];
	});
}

describe("#47 icons in live preview without scrolling", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shows the icons for visible links the parser had not reached when the editor opened", async () => {
		showEndOfDocument();
		const plugin = createPlugin();
		const view = createEditor(plugin, doc);
		expect(syntaxTree(view.state).length).toBeLessThan(doc.length);

		const decorations = await iconDecorationsOf(view, 1000);

		expect(syntaxTree(view.state).length).toBe(doc.length);
		expect(decorations.map(deco => deco.qualifier)).toEqual(["obsidian.md", "github.com"]);
	});
});
