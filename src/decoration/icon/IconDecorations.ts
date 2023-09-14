import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {syntaxTree, tokenClassNodeProp} from "@codemirror/language";
import FaviconPlugin from "../../main";
import {TokenSpec} from "../TokenSpec";
import {IconDecorationSet} from "./IconDecorationSet";
import {findOpenParen} from "../../functions";
import {editorLivePreviewField} from "obsidian";
import {defineStatefulDecoration} from "../Decoration";

//based on: https://gist.github.com/nothingislost/faa89aa723254883d37f45fd16162337

export const iconDecorations = defineStatefulDecoration();

function buildViewPlugin(plugin: FaviconPlugin) {
	return ViewPlugin.fromClass(
		class {
			decoManager: IconDecorationSet;

			constructor(view: EditorView) {
				this.decoManager = new IconDecorationSet(view, plugin);
				this.buildAsyncDecorations(view);
			}

			update(update: ViewUpdate) {
				const differentModes = update.startState.field(editorLivePreviewField) != update.state.field(editorLivePreviewField);
				if (update.docChanged || update.viewportChanged || differentModes) {
					this.buildAsyncDecorations(update.view);
				}
			}

			destroy() {
			}

			buildAsyncDecorations(view: EditorView) {
				const targetElements: TokenSpec[] = [];
				//live preview
				if (view.state.field(editorLivePreviewField) && !plugin.settings.enableLivePreview) {
					this.decoManager.debouncedUpdate(targetElements);
					return;
				}
				//source mode
				if (!view.state.field(editorLivePreviewField) && !plugin.settings.enableSource) {
					this.decoManager.debouncedUpdate(targetElements);
					return;

				}
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
								let linkText = view.state.sliceDoc(node.from, node.to);
								console.log(linkText);
								if (isExternalLink && linkText.includes(":")) {
									linkText = linkText.replace(/[<>]/g, '');
									const before = view.state.doc.sliceString(node.from - 1, node.from);
									if (before !== "(") {
										if (!plugin.settings.showLink) return;
										if (plugin.settings.iconPosition === "front") {
											targetElements.push({from: node.from, to: node.to, value: linkText});
										}
										if (plugin.settings.iconPosition === "back") {
											targetElements.push({from: node.to, to: node.to + 1, value: linkText});
										}
										return;
									}

									if (!plugin.settings.showAliased) return;

									//scanning for the matching opening bracket of the alias, to get the correct position for the icon
									const line = view.state.doc.lineAt(node.from);
									const toLine = line.to - node.to;
									const toLineT = line.length - toLine;
									const lastIndex = line.text.lastIndexOf("]", toLineT);
									const open = findOpenParen(line.text, lastIndex);
									if (open === -1) {
										return;
									}

									const fromTarget = line.from + open;
									const fullText = view.state.sliceDoc(fromTarget, node.to);
									if (fullText.contains("|nofavicon")) return;

									if (plugin.settings.iconPosition === "front") {
										targetElements.push({from: fromTarget, to: node.to, value: linkText});
									}
									if (plugin.settings.iconPosition === "back") {
										targetElements.push({from: node.to, to: node.to + 1, value: linkText});
									}
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
	return [iconDecorations.field, buildViewPlugin(plugin)];
}
