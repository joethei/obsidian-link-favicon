import {Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {StateEffect, StateEffectType, StateField} from "@codemirror/state";
import {syntaxTree, tokenClassNodeProp} from "@codemirror/language";
import FaviconPlugin from "../main";
import {TokenSpec} from "./TokenSpec";
import {StatefulDecorationSet} from "./StatefulDecorationSet";
import {findOpenParen} from "../functions";

//based on: https://gist.github.com/nothingislost/faa89aa723254883d37f45fd16162337

export const statefulDecorations = defineStatefulDecoration();

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
				const isLivePreview = view.dom.parentElement.classList.contains("is-live-preview");
				if(isLivePreview && !plugin.settings.enableLivePreview) {
					return;
				}
				if(!isLivePreview && !plugin.settings.enableSource) {
					return;
				}

				const targetElements: TokenSpec[] = [];
				for (const {from, to} of view.visibleRanges) {
					const tree = syntaxTree(view.state);
					tree.iterate({
						from,
						to,
						enter: (node) => {
							const tokenProps = node.type.prop<string>(tokenClassNodeProp);
							if (tokenProps) {
								const props = new Set(tokenProps.split(" "));
								const isExternalLink = props.has("url");
								let linkText = view.state.doc.sliceString(node.from, node.to);
								linkText = linkText.replace(/[<>]/g, '');
								if (isExternalLink && linkText.contains(":")) {
									const line = view.state.doc.lineAt(node.from);
									const before = view.state.doc.sliceString(node.from - 1, node.from);
									if(before !== "(") {
										if(!plugin.settings.showLink) return;
										targetElements.push({from: node.from, to: node.to, value: linkText});
										return;
									}

									if(!plugin.settings.showAliased) return;

									//scanning for the matching opening bracket of the alias, to get the correct position for the icon
									const toLine = line.to - node.to;
									const toLineT = line.length - toLine;
									const lastIndex = line.text.lastIndexOf("]", toLineT);
									const open = findOpenParen(line.text, lastIndex);
									if(open === -1) {
										return;
									}
									const fromTarget = line.from + open;
									targetElements.push({from: fromTarget, to: node.to, value: linkText});
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
function defineStatefulDecoration(): { update: StateEffectType<DecorationSet>; field: StateField<DecorationSet>; } {
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
