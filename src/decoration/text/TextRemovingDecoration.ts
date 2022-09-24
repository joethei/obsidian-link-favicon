import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {IconDecorationSet} from "../icon/IconDecorationSet";
import {TokenSpec} from "../TokenSpec";
import {syntaxTree} from "@codemirror/language";
import FaviconPlugin from "../../main";
import {defineStatefulDecoration} from "../Decoration";
import {TextDecorationSet} from "./TextDecorationSet";
import {editorLivePreviewField} from "obsidian";

export const textRemovingDecorations = defineStatefulDecoration();

function buildViewPlugin(plugin: FaviconPlugin) {
	return ViewPlugin.fromClass(
		class {
			decoManager: IconDecorationSet;


			constructor(public view: EditorView) {
				this.decoManager = new TextDecorationSet(view, plugin);

			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.buildAsyncDecorations(update.view);
				}
			}

			buildAsyncDecorations(view: EditorView) {
				const targetElements: TokenSpec[] = [];
				if (!view.state.field(editorLivePreviewField)) {
					this.decoManager.debouncedUpdate(targetElements);
					return;
				}

				for (const {from, to} of view.visibleRanges) {
					const text = view.state.sliceDoc(from, to);
					for (let match of text.matchAll(/\|nofavicon/g)) {
						const matchFrom = match.index;
						const matchTo = matchFrom + match[0].length;
						let inSelection = false;
						for (let range of view.state.selection.ranges) {
							if ((range.from <= matchFrom && range.to >= matchTo) || (range.from >= matchFrom && range.to <= matchTo)) {
								inSelection = true;
							}
						}
						if(!inSelection)
							targetElements.push({from: matchFrom, to: matchTo, value: ""});
					}
				}
				this.decoManager.debouncedUpdate(targetElements);
			}
		}
	);
}

export function textRemovingDecoration(plugin: FaviconPlugin) {
	return [textRemovingDecorations.field, buildViewPlugin(plugin)];
}
