import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	hasIcon(el: HTMLElement) {
		if (el.getElementsByTagName("img").length > 0) return true;
		if (el.getElementsByTagName("svg").length > 0) return true;
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));

		this.registerMarkdownPostProcessor((element, _) => {
			const links = element.querySelectorAll("a");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index);
				if(link.classList.contains("external-link")) {
					if(!this.hasIcon(link)) {
						const domain = new URL(link.href);
						const el = document.createElement("img");
						if(this.settings.provider === "google") {
							el.src = "https://www.google.com/s2/favicons?domain=" + domain.hostname;
						}
						if(this.settings.provider === "duckduckgo") {
							el.src = "https://icons.duckduckgo.com/ip3/" + domain.hostname + ".ico"
						}
						el.style.height = "1em";
						el.addClass("link-favicon");
						el.setAttribute("data-host", domain.hostname);
						link.prepend(el);
					}
				}
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
