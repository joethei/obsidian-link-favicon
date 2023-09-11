import {Decoration, DecorationSet, EditorView} from "@codemirror/view";
import FaviconPlugin from "../../main";
import {debounce, Debouncer} from "obsidian";
import {TokenSpec} from "../TokenSpec";
import {Range} from "@codemirror/rangeset";
import {textRemovingDecorations} from "./TextRemovingDecoration";

export class TextDecorationSet {
	editor: EditorView;
	plugin: FaviconPlugin;
	decoCache: { [cls: string]: Decoration } = Object.create(null);
	debouncedUpdate: Debouncer<[tokens: TokenSpec[]]>;

	constructor(editor: EditorView, plugin: FaviconPlugin) {
		this.editor = editor;
		this.plugin = plugin;
		this.debouncedUpdate = debounce(this.updateAsyncDecorations, this.plugin.settings.debounce, true);
	}

	async computeAsyncDecorations(tokens: TokenSpec[]): Promise<DecorationSet | null> {
		const decorations: Range<Decoration>[] = [];
		for (const token of tokens) {
			let deco = this.decoCache[token.value];
			if (!deco) {
				deco = this.decoCache[token.value] = Decoration.replace({});
			}
			decorations.push(deco.range(token.from, token.to));
		}
		return Decoration.set(decorations, true);
	}

	async updateAsyncDecorations(tokens: TokenSpec[]): Promise<void> {
		const decorations = await this.computeAsyncDecorations(tokens);
		// if our compute function returned nothing and the state field still has decorations, clear them out
		if (decorations || this.editor.state.field(textRemovingDecorations.field).size) {
			this.editor.dispatch({ effects: textRemovingDecorations.update.of(decorations || Decoration.none) });
		}
	}
}
