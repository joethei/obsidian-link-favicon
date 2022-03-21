import {Decoration, DecorationSet, EditorView} from "@codemirror/view";
import FaviconPlugin from "../main";
import {debounce, Debouncer} from "obsidian";
import {TokenSpec} from "./TokenSpec";
import {Range} from "@codemirror/rangeset";
import {providers} from "../provider";
import {IconWidget} from "./IconWidget";
import {statefulDecorations} from "./Decorations";

export class StatefulDecorationSet {
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

				const provider = providers[this.plugin.settings.provider];
				const fallbackProvider = providers[this.plugin.settings.fallbackProvider];

				let url: URL;

				try {
					url = new URL(token.value);
				}catch (e) {
					console.error("Invalid url: " + token.value);
					console.error(e);
					continue;
				}

				const icon = await this.plugin.getIcon(url, provider);
				const fallbackIcon = await this.plugin.getIcon(url, fallbackProvider);
				const domain = url.protocol.contains("http") ? url.hostname : url.protocol;

				deco = this.decoCache[token.value] = Decoration.widget({ widget: new IconWidget(this.plugin, icon, fallbackIcon, domain, token) });
			}
			decorations.push(deco.range(token.from, token.from));
		}
		return Decoration.set(decorations, true);
	}

	async updateAsyncDecorations(tokens: TokenSpec[]): Promise<void> {
		const decorations = await this.computeAsyncDecorations(tokens);
		// if our compute function returned nothing and the state field still has decorations, clear them out
		if (decorations || this.editor.state.field(statefulDecorations.field).size) {
			this.editor.dispatch({ effects: statefulDecorations.update.of(decorations || Decoration.none) });
		}
	}
}
