import {Decoration, DecorationSet, EditorView} from "@codemirror/view";
import FaviconPlugin from "../../main";
import {debounce, Debouncer} from "obsidian";
import {TokenSpec} from "../TokenSpec";
import {Range} from "@codemirror/state";
import {providers} from "../../provider";
import {IconWidget} from "./IconWidget";
import {iconDecorations} from "./IconDecorations";

export class IconDecorationSet {
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

				const provider = providers[this.plugin.settings.provider];
				const fallbackProvider = providers[this.plugin.settings.fallbackProvider];

					if (!provider || !fallbackProvider) continue;
					const icon = await this.plugin.getIcon(token.value, provider);
					const fallbackIcon = await this.plugin.getIcon(token.value, fallbackProvider);
				const url = this.plugin.iconAdder.constructURL(token.value);
				if (url) {
					const domain = url.protocol.contains("http") ? url.hostname : url.protocol;

						deco = Decoration.widget({widget: new IconWidget(this.plugin, icon, fallbackIcon, domain, token)});
						this.decoCache.set(token.value, deco);
					}

				}
				if (!deco) continue;
				decorations.push(deco.range(token.from, token.from));
		}
		return Decoration.set(decorations, true);
	}

	async updateAsyncDecorations(tokens: TokenSpec[]): Promise<void> {
		const decorations = await this.computeAsyncDecorations(tokens);
		// if our compute function returned nothing and the state field still has decorations, clear them out
		if (decorations || this.editor.state.field(iconDecorations.field).size) {
			this.editor.dispatch({effects: iconDecorations.update.of(decorations || Decoration.none)});
		}
	}
}
