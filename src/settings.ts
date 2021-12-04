import {App, PluginSettingTab, Setting} from "obsidian";
import FaviconPlugin from "./main";

export interface FaviconPluginSettings {
	provider: string;
	ignored: string;
}

export const DEFAULT_SETTINGS: FaviconPluginSettings = {
	provider: 'google',
	ignored: '',
}

export class FaviconSettings extends PluginSettingTab {
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
			.setName("Icon Provider")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("google", "Google")
					.addOption("duckduckgo", "DuckDuckGo")
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value;
						await this.plugin.saveSettings();
					})
			});

		new Setting(containerEl)
			.setName('Ignored Domains')
			.addTextArea(text => text
				.setValue(this.plugin.settings.ignored)
				.onChange(async (value) => {
					this.plugin.settings.ignored = value;
					await this.plugin.saveSettings();
				}));
	}
}
