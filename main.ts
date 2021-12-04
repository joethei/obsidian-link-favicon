import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

interface FaviconPluginSettings {
	provider: string;
	ignored: string[];
}

const DEFAULT_SETTINGS: FaviconPluginSettings = {
	provider: 'google',
	ignored: [],
}

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));

		this.registerMarkdownPostProcessor((element, context) => {
			const links = element.querySelectorAll("a");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index);
				if(link.classList.contains("external-link")) {
					const domain = new URL(link.href);
					const el = document.createElement("img");
					el.src = "https://icons.duckduckgo.com/ip3/" + domain.hostname + ".ico"
					el.style.height = "1em";
					link.prepend(el);
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

class FaviconSettings extends PluginSettingTab {
	plugin: FaviconPlugin;

	constructor(app: App, plugin: FaviconPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Link Favicons'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.provider = value;
					await this.plugin.saveSettings();
				}));
	}
}
