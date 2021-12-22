import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings, OverwrittenFavicon} from "./settings";
import {providers} from "./provider";
import {getApi, isPluginEnabled} from "@aidenlx/obsidian-icon-shortcodes";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	isDisabled(el: Element) {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
	}

	displayCustomIcon(icons: OverwrittenFavicon[], link: HTMLAnchorElement): boolean {
		if (icons.length > 0) {
			const iconApi = getApi(this);
			const icon = icons[0].icon;
			const icon2 = iconApi.getIcon(icon, false);
			if (icon2 !== null) {
				if (typeof icon2 !== "string") {
					icon2.addClass("link-favicon");
				}
				link.prepend(icon2);
				return true;
			}
		}
		return false;
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));

		this.registerMarkdownPostProcessor(async (element, ctx) => {
			if(ctx.sourcePath.contains("no-favicon")) {
				return;
			}

			const provider = providers[this.settings.provider];
			const fallbackProvider = providers[this.settings.fallbackProvider];

			if (!provider || !fallbackProvider) {
				console.error("Link Favicons: misconfigured providers");
				return;
			}

			const links = element.querySelectorAll("a.external-link:not([data-favicon])");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index) as HTMLAnchorElement;
				if (!this.isDisabled(link)) {
					link.dataset.favicon = "true";
					try {
						const domain = new URL(link.href);

						//custom protocols
						if (!domain.protocol.contains("http")) {
							if(isPluginEnabled(this)) {
								const icons = this.settings.protocol.filter((overwritten) => overwritten.domain === domain.protocol.replace(/:/g, ''));
								if (this.displayCustomIcon(icons, link))
									continue;
							}
						}

						if (this.settings.ignored.split("\n").contains(domain.hostname)) {
							continue;
						}

						//custom domain icons
						if (isPluginEnabled(this)) {
							const icons = this.settings.overwritten.filter((overwritten) => overwritten.domain === domain.hostname);
							if (this.displayCustomIcon(icons, link))
								continue;
						}

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
