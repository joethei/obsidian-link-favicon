import {WidgetType} from "@codemirror/view";
import FaviconPlugin from "../main";
import {requireApiVersion} from "obsidian";
import {TokenSpec} from "./TokenSpec";

export class IconWidget extends WidgetType {
	domain: string;
	icon: string | HTMLImageElement | HTMLSpanElement;
	fallbackIcon: string | HTMLImageElement | HTMLSpanElement;
	plugin: FaviconPlugin;
	token: TokenSpec;

	constructor(plugin: FaviconPlugin, icon: string | HTMLImageElement | HTMLSpanElement, fallbackIcon: string | HTMLImageElement | HTMLSpanElement, domain: string, token: TokenSpec) {
		super();
		this.plugin = plugin;
		this.icon = icon;
		this.fallbackIcon = fallbackIcon;
		this.domain = domain;
		this.token = token;
	}

	eq(other: IconWidget) {
		return other === this;
	}

	toDOM() {
		if (!this.icon || this.icon === "") {
			console.log("empty icon for " + this.domain);
			return document.createElement("span");
		}

		if (typeof this.icon !== "string") {
			return this.icon.cloneNode(true) as HTMLSpanElement;
		}

		if (!this.icon.startsWith("http")) {
			const span = document.createElement("span");
			span.textContent = this.icon;
			return span;
		}

		//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
		const el = document.createElement("object");
		el.addClass("link-favicon");
		el.dataset.host = this.domain;

		if (typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25")) {
			el.data = this.icon;
		} else {
			this.plugin.downloadIconToBlob(this.icon, this.domain).then(value => {
				el.data = value;

				const tmpImg = document.createElement("img");
				tmpImg.crossOrigin = 'anonymous';
				tmpImg.src = value;

				this.plugin.setColorAttributes(tmpImg).then(() => {
					for (const data of Object.keys(tmpImg.dataset)) {
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

		if (typeof this.fallbackIcon === "string") {
			const img = el.createEl("img");
			if (typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25")) {
				img.src = this.fallbackIcon;
			} else {
				this.plugin.downloadIconToBlob(this.fallbackIcon, this.domain).then(async value => {
					img.src = value;
					await this.plugin.setColorAttributes(img);
				});
			}

			img.addClass("link-favicon");
			img.style.height = "0.8em";
			img.style.display = "block";

			el.append(img);
		}

		return el;

	}

	ignoreEvent(): boolean {
		return true;
	}
}
