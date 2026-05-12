import {Decoration, DecorationSet, EditorView} from "@codemirror/view";
import FaviconPlugin from "../../main";
import {debounce, Debouncer} from "obsidian";
import {TokenSpec} from "../TokenSpec";
import {Range} from "@codemirror/state";
import {textRemovingDecorations} from "./TextRemovingDecoration";

export class TextDecorationSet {
	editor: EditorView;
	plugin: FaviconPlugin;
	decoCache = new Map<string, Decoration>();
	debouncedUpdate: Debouncer<[tokens: TokenSpec[]], Promise<void>>;

	constructor(editor: EditorView, plugin: FaviconPlugin) {
		this.editor = editor;
		this.plugin = plugin;
		this.debouncedUpdate = debounce(this.updateAsyncDecorations.bind(this), this.plugin.settings.debounce, true);
	}

	async computeAsyncDecorations(tokens: TokenSpec[]): Promise<DecorationSet | null> {
		const decorations: Range<Decoration>[] = [];
		for (const token of tokens) {
			let deco = this.decoCache.get(token.value);
			if (!deco) {
				deco = Decoration.replace({});
				this.decoCache.set(token.value, deco);
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
