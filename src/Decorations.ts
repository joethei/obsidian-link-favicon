import { debounce } from "obsidian";
import { EditorView, Decoration, DecorationSet, ViewUpdate, ViewPlugin, WidgetType } from "@codemirror/view";
import { StateField, StateEffect, StateEffectType } from "@codemirror/state";
import { Range } from "@codemirror/rangeset";
import { syntaxTree } from "@codemirror/language";
// @ts-ignore
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import FaviconPlugin from "./main";
import {providers} from "./provider";

//based on: https://gist.github.com/nothingislost/faa89aa723254883d37f45fd16162337

interface TokenSpec {
	from: number;
	to: number;
	value: string;
}

const statefulDecorations = defineStatefulDecoration();

class StatefulDecorationSet {
	editor: EditorView;
	plugin: FaviconPlugin;
	decoCache: { [cls: string]: Decoration } = Object.create(null);

	constructor(editor: EditorView, plugin: FaviconPlugin) {
		this.editor = editor;
		this.plugin = plugin;
	}

	async computeAsyncDecorations(tokens: TokenSpec[]): Promise<DecorationSet | null> {
		const decorations: Range<Decoration>[] = [];
		for (let token of tokens) {
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
				}

				const icon = await this.plugin.getIcon(url, provider);
				const fallbackIcon = await this.plugin.getIcon(url, fallbackProvider);
				const domain = url.protocol.contains("http") ? url.hostname : url.protocol;

				deco = this.decoCache[token.value] = Decoration.widget({ widget: new IconWidget(this.plugin, icon, fallbackIcon, domain) });
			}
			decorations.push(deco.range(token.from, token.from));
		}
		return Decoration.set(decorations, true);
	}

	debouncedUpdate = debounce(this.updateAsyncDecorations, 100, true);

	async updateAsyncDecorations(tokens: TokenSpec[]): Promise<void> {
		const decorations = await this.computeAsyncDecorations(tokens);
		// if our compute function returned nothing and the state field still has decorations, clear them out
		if (decorations || this.editor.state.field(statefulDecorations.field).size) {
			this.editor.dispatch({ effects: statefulDecorations.update.of(decorations || Decoration.none) });
		}
	}
}

function buildViewPlugin(plugin: FaviconPlugin) {
	return ViewPlugin.fromClass(
		class {
			decoManager: StatefulDecorationSet;

			constructor(view: EditorView) {
				this.decoManager = new StatefulDecorationSet(view, plugin);
				this.buildAsyncDecorations(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.buildAsyncDecorations(update.view);
				}
			}

			destroy() {
			}

			buildAsyncDecorations(view: EditorView) {
				const targetElements: TokenSpec[] = [];
				for (let {from, to} of view.visibleRanges) {
					const tree = syntaxTree(view.state);
					tree.iterate({
						from,
						to,
						enter: (type, from, to) => {
							const tokenProps = type.prop(tokenClassNodeProp);
							if (tokenProps) {
								// @ts-ignore
								const props = new Set(tokenProps.split(" "));
								const isExternalLink = props.has("url");
								const linkText = view.state.doc.sliceString(from, to);
								if (isExternalLink && linkText.contains("://")) {
									const line = view.state.doc.lineAt(from);

									//scanning for the last occurrence of [ before link, to get the correct position for the icon
									const toLine = line.to - to;
									const toLineT = line.length - toLine;
									const fromIndex = line.text.lastIndexOf("[", toLineT);
									if(fromIndex === -1) {
										return;
									}
									const fromTarget = line.from + fromIndex;
									targetElements.push({from: fromTarget, to: to, value: linkText});
								}
							}
						},
					});
				}
				this.decoManager.debouncedUpdate(targetElements);
			}
		}
	);
}

export function asyncDecoBuilderExt(plugin: FaviconPlugin) {
	return [statefulDecorations.field, buildViewPlugin(plugin)];
}

////////////////
// Utility Code
////////////////

// Generic helper for creating pairs of editor state fields and
// effects to model imperatively updated decorations.
// source: https://github.com/ChromeDevTools/devtools-frontend/blob/8f098d33cda3dd94b53e9506cd3883d0dccc339e/front_end/panels/sources/DebuggerPlugin.ts#L1722
function defineStatefulDecoration(): {
	update: StateEffectType<DecorationSet>;
	field: StateField<DecorationSet>;
} {
	const update = StateEffect.define<DecorationSet>();
	const field = StateField.define<DecorationSet>({
		create(): DecorationSet {
			return Decoration.none;
		},
		update(deco, tr): DecorationSet {
			return tr.effects.reduce((deco, effect) => (effect.is(update) ? effect.value : deco), deco.map(tr.changes));
		},
		provide: field => EditorView.decorations.from(field),
	});
	return { update, field };
}

class IconWidget extends WidgetType {
	domain: string;
	icon: string | HTMLImageElement;
	fallbackIcon: string | HTMLImageElement;
	plugin: FaviconPlugin;
	constructor(plugin: FaviconPlugin, icon: string | HTMLImageElement, fallbackIcon: string | HTMLImageElement, domain: string) {
		super();
		this.plugin = plugin;
		this.icon = icon;
		this.fallbackIcon = fallbackIcon;
		this.domain = domain;
	}

	eq(other: IconWidget) {
		return other == this;
	}

	toDOM() {
		if(typeof this.icon === "string") {
			if(!this.icon.startsWith("http")) {
				let span = document.createElement("span");
				span.textContent = this.icon;
				span.className = "link-favicon";
				return span;
			}
			//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
			const el = document.createElement("object");
			el.addClass("link-favicon");
			el.dataset.host = this.domain;
			el.data = this.icon;
			//only png and icon are ever used by any provider
			el.data.contains(".ico") ? el.type = "image/x-icon" : el.type = "image/png";

			//making sure these styles will not be overwritten by any other theme/plugin
			//i.e. page preview sets height: auto, which creates huge icons.
			el.style.height = "0.8em";
			el.style.display = "inline-block";

			if(typeof this.fallbackIcon === "string") {
				const img = el.createEl("img");
				img.src = this.fallbackIcon;
				img.addClass("link-favicon");
				img.style.height = "0.8em";
				img.style.display = "block";

				el.append(img);

			}

			return el;
		}else {
			return this.icon;
		}


	}

	ignoreEvent(): boolean {
		return false;
	}
}
