import {MarkdownPostProcessorContext, requireApiVersion} from "obsidian";
import {providers} from "./provider";
import FaviconPlugin from "./main";

export class PostProcessor {
	plugin: FaviconPlugin;

	constructor(plugin: FaviconPlugin) {
		this.plugin = plugin;
	}


	isDisabled = (el: Element) => {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
		if (!this.plugin.settings.showLink && el.textContent === el.getAttribute("href")) return true;
		if (!this.plugin.settings.showAliased && el.textContent !== el.getAttribute("href")) return true;
	}

	processor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
		if (!this.plugin.settings.enableReading) {
			return;
		}

		if (context.sourcePath.contains("no-favicon")) {
			return;
		}

		const provider = providers[this.plugin.settings.provider];
		const fallbackProvider = providers[this.plugin.settings.fallbackProvider];

		if (!provider || !fallbackProvider) {
			console.error("Link Favicons: misconfigured providers");
			return;
		}

		//delay rendering in Preview, to allow other plugins to finish their stuff(like dataview for issue #13)
		const timeout = 100;
		setTimeout(async () => {
			const links = element.querySelectorAll("a.external-link:not([data-favicon])");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index) as HTMLAnchorElement;
				if (!this.isDisabled(link)) {
					link.dataset.favicon = "true";

					let domain;

					try {
						domain = new URL(link.href);
					} catch (e) {
						console.error("Invalid url: " + link.href);
						console.error(e);
						continue;
					}

					const icon = await this.plugin.getIcon(domain, provider);
					const fallbackIcon = await this.plugin.getIcon(domain, fallbackProvider);

					let el: string | HTMLObjectElement | HTMLImageElement;

					if (!icon || icon === "") {
						console.log("no icon for " + domain.href);
						continue;
					}

					if (typeof icon === "string") {
						if (!icon.startsWith("http")) {
							el = icon;
						} else {
							//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
							el = document.createElement("object");
							el.addClass("link-favicon");
							el.dataset.host = domain.hostname;


							if (typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25")) {
								el.data = icon;
							} else {
								const blob = await this.plugin.downloadIconToBlob(icon, domain.hostname);
								el.data = blob;

								if (typeof el !== "string") {
									const tmpImg = document.createElement("img");
									tmpImg.src = blob;

									await this.plugin.setColorAttributes(tmpImg);
									for (const data of Object.keys(tmpImg.dataset)) {
										el.dataset[data] = tmpImg.dataset[data];
									}
								}
							}


							//only png and icon are ever used by any provider
							el.data.contains(".ico") ? el.type = "image/x-icon" : el.type = "image/png";

							//making sure these styles will not be overwritten by any other theme/plugin
							//i.e. page preview sets height: auto, which creates huge icons.
							el.style.height = "0.8em";
							el.style.display = "inline-block";
						}

					} else {
						link.prepend(icon);
						continue;
					}

					if (!el) continue;

					if (typeof el !== "string" && typeof fallbackIcon === "string") {
						const img = el.createEl("img");
						img.addClass("link-favicon");

						if (typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25")) {
							img.src = fallbackIcon;
						} else {
							img.src = await this.plugin.downloadIconToBlob(fallbackIcon, domain.hostname);
							await this.plugin.setColorAttributes(img);
						}

						img.style.height = "0.8em";
						img.style.display = "block";

						el.append(img);
					}

					if (el) {
						link.prepend(el);
					}
				}
			}
		}, timeout);

	}
}
