import {EditorView, WidgetType} from "@codemirror/view";

export class TextWidget extends WidgetType {

	private readonly text: string;

	constructor(text: string) {
		super();
		this.text = text;
	}

	toDOM(view: EditorView): HTMLElement {
		const el = document.createElement("span");
		el.setText(this.text);
		return el;
	}

}
