import {App} from "obsidian";
import {TextInputSuggest} from "./suggest";

export class SchemaSuggest extends TextInputSuggest<string> {

	content: Set<string>;
	descriptions: Set<{name: string, description: string}>;

	constructor(app: App, input: HTMLInputElement, content: Set<string>, descriptions: Set<{name: string, description: string}>) {
		super(app, input);
		this.content = content;
		this.descriptions = descriptions;
	}

	getSuggestions(inputStr: string): string[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		const schemas = [...this.descriptions].filter(schema => {
			return schema.name.toLowerCase().contains(lowerCaseInputStr) || schema.description.toLowerCase().contains(lowerCaseInputStr);
		});
		return Object.values(schemas).map(value => value.name);
	}

	renderSuggestion(content: string, el: HTMLElement): void {
		el.createSpan().setText(content + "   ");
		const description = [...this.descriptions].filter((item) => content === item.name)[0].description;
		if(description !== content) {
			el.createEl("small").setText(description);
		}
	}

	selectSuggestion(content: string): void {
		this.inputEl.value = content;
		this.inputEl.trigger("input");
		this.close();
	}
}
