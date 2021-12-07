import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";
import IconProvider from "./provider";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	isDisabled(el: Element) {
		if (el.getAttribute("data-no-favicon")) return true;
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));

		this.registerMarkdownPostProcessor(async (element, _) => {
			const provider = IconProvider.providers.find((provider) => provider.id === this.settings.provider);
			const fallbackProvider = IconProvider.providers.find((provider) => provider.id === this.settings.fallbackProvider);

			if(!provider || !fallbackProvider) {
				console.log("Link Favicons: misconfigured providers");
				return;
			}

			const links = element.querySelectorAll("a.external-link");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index) as HTMLAnchorElement;
				if (!this.isDisabled(link)) {
					let domain;
					try {
						domain = new URL(link.href);
					} catch (e) {
						console.log("Link Favicons: invalid url: " + link.href);
					}

					if(!this.settings.ignored.split("\n").contains(domain.hostname) && domain) {

						//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
						const el = document.createElement("object");

						el.addClass("link-favicon");
						el.setAttribute("data-host", domain.hostname);

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
						img.style.display = "inline-block";

						link.setAttribute("data-favicon", "true");
						link.prepend(el);
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
