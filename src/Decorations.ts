import {debounce, requireApiVersion} from "obsidian";
import {Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType} from "@codemirror/view";
import {StateEffect, StateEffectType, StateField} from "@codemirror/state";
import {Range} from "@codemirror/rangeset";
import {syntaxTree} from "@codemirror/language";
import {tokenClassNodeProp} from "@codemirror/stream-parser";
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
				for (const {from, to} of view.visibleRanges) {
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
								let linkText = view.state.doc.sliceString(from, to);
								linkText = linkText.replace(/[<>]/g, '');
								if (isExternalLink && linkText.contains("://")) {
									const line = view.state.doc.lineAt(from);
									const before = view.state.doc.sliceString(from - 1, from);
									if(before !== "(") {
										if(!plugin.settings.showLink) return;
										targetElements.push({from: from, to: to, value: linkText});
										return;
									}

									if(!plugin.settings.showAliased) return;

									//scanning for the matching opening bracket of the alias, to get the correct position for the icon
									const toLine = line.to - to;
									const toLineT = line.length - toLine;
									const lastIndex = line.text.lastIndexOf("]", toLineT);
									const open = plugin.findOpenParen(line.text, lastIndex);
									if(open === -1) {
										return;
									}
									const fromTarget = line.from + open;

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

		if(!this.icon || this.icon === "") {
			return document.createElement("span");
		}

		if(typeof this.icon === "string") {
			if(!this.icon.startsWith("http")) {
				const span = document.createElement("span");
				span.textContent = this.icon;
				span.className = "link-favicon";
				return span;
			}
			//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
			const el = document.createElement("object");
			el.addClass("link-favicon");
			el.dataset.host = this.domain;

			if (!requireApiVersion("0.13.25")) {
				el.data = this.icon;
			}else {
				this.plugin.downloadIconToBlob(this.icon).then(value => {
					el.data = value;

					const tmpImg = document.createElement("img");
					tmpImg.crossOrigin = 'anonymous';
					tmpImg.src = value;

					this.plugin.setColorAttributes(tmpImg).then(() => {
						for(const data of Object.keys(tmpImg.dataset)) {
							el.dataset[data] = tmpImg.dataset[data];
						}
					});
				});
			}

			//only png and icon are ever used by any provider
			el.data.contains(".ico") ? el.type = "image/x-icon" : el.type = "image/png";

			//making sure these styles will not be overwritten by any other theme/plugin
			//i.e. page preview sets height: auto, which creates huge icons.
			el.style.height = "0.8em";
			el.style.display = "inline-block";

			if(typeof this.fallbackIcon === "string") {
				const img = el.createEl("img");

				if (!requireApiVersion("0.13.25")) {
					img.src = this.fallbackIcon;
				}else {
					this.plugin.downloadIconToBlob(this.fallbackIcon).then(value => {
						img.src = value;
						this.plugin.setColorAttributes(img);
					});
				}

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
