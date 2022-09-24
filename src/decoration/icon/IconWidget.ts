import {WidgetType} from "@codemirror/view";
import FaviconPlugin from "../../main";
import {TokenSpec} from "../TokenSpec";
import {IconElement} from "../../types";

export class IconWidget extends WidgetType {
	qualifier: string;
	icon: IconElement;
	fallbackIcon: IconElement;
	plugin: FaviconPlugin;
	token: TokenSpec;

	constructor(plugin: FaviconPlugin, icon: IconElement, fallbackIcon: IconElement, qualifier: string, token: TokenSpec) {
		super();
		this.plugin = plugin;
		this.icon = icon;
		this.fallbackIcon = fallbackIcon;
		this.qualifier = qualifier;
		this.token = token;
	}

	override eq(other: IconWidget) {
		return other === this;
	}

	toDOM() {
		if (!this.icon || this.icon === "") {
			console.log("empty icon for " + this.qualifier);
			return activeDocument.createElement("span");
		}

		if (typeof this.icon !== "string") {
			return this.icon.cloneNode(true) as HTMLSpanElement;
		}

		if (!this.icon.startsWith("http")) {
			const span = activeDocument.createElement("span");
			span.textContent = this.icon;
			return span;
		}

		const span = activeDocument.createElement("span");
		this.plugin.iconAdder.getImageEl(this.icon, this.qualifier).then((obj) => {
			span.append(obj);
		}).catch((e) => {
			console.error(e);
		})

		return span;

	}

	override ignoreEvent(): boolean {
		return true;
	}
}
