import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";
import {providers} from "./provider";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	isDisabled(el: Element) {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
		const style = getComputedStyle(el, ":before").getPropertyValue("background-url");
		console.log(style);
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));

		this.registerMarkdownPostProcessor(async (element, _) => {

			const provider = providers[this.settings.provider];
			const fallbackProvider = providers[this.settings.fallbackProvider];

			if (!provider || !fallbackProvider) {
				console.log("Link Favicons: misconfigured providers");
				return;
			}

			const links = element.querySelectorAll("a.external-link:not([data-favicon])");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index) as HTMLAnchorElement;
				if (!this.isDisabled(link)) {
					link.dataset.favicon = "true";
					try {
						const domain = new URL(link.href);
						if (!this.settings.ignored.split("\n").contains(domain.hostname)) {

							//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
							const el = document.createElement("object");

							el.addClass("link-favicon");
							el.dataset.host = domain.hostname;

							el.data = await provider.url(domain.hostname, this.settings);
							//only png and icon are ever used by any provider
							el.data.contains(".ico") ? el.type = "image/x-icon" : el.type = "image/png";

							//making sure these styles will not be overwritten by any other theme/plugin
							//i.e. page preview sets height: auto, which creates huge icons.
							el.style.height = "0.8em";
							el.style.display = "inline-block";

							const img = el.createEl("img");
							img.src = await fallbackProvider.url(domain.hostname, this.settings);
							img.addClass("link-favicon");
							img.style.height = "0.8em";
							img.style.display = "block";

							link.prepend(el);
						}
					} catch (e) {
						console.log("Link Favicons: invalid url: " + link.href);
					}
				}
			}
		});
	}

	onunload() {
		console.log("disabling plugin: link favicons");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
