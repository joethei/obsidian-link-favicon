import {Plugin, request} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";

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
			const links = element.querySelectorAll("a.external-link");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index);
				if (!this.isDisabled(link)) {
					//@ts-ignore
					const domain = new URL(link.href);
					if(!this.settings.ignored.split("\n").contains(domain.hostname)) {
						const el = document.createElement("img");
						if (this.settings.provider === "google") {
							el.src = "https://www.google.com/s2/favicons?domain=" + domain.hostname;
						}
						if (this.settings.provider === "duckduckgo") {
							el.src = "https://icons.duckduckgo.com/ip3/" + domain.hostname + ".ico";
						}
						if (this.settings.provider === "splitbee") {
							el.src = "https://favicon.splitbee.io/?url=" + domain.hostname;
						}
						if (this.settings.provider === "besticon") {
							el.src = this.settings.customDomain + "/icon?url=" + domain.hostname + "&size=32..128..256";
						}
						if (this.settings.provider === "iconhorse") {
							el.src = "https://icon.horse/icon/" + domain.hostname;
						}
						if (this.settings.provider === "favicongrabber") {
							const icons = JSON.parse(await request({
								method: "GET",
								url: "https://favicongrabber.com/api/grab/" + domain.hostname
							}));
							el.src = icons.icons[0].src;
						}

						el.addClass("link-favicon");
						el.setAttribute("data-host", domain.hostname);
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
