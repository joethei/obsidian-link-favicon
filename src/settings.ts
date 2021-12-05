import {App, PluginSettingTab, Setting} from "obsidian";
import FaviconPlugin from "./main";

export interface FaviconPluginSettings {
	provider: string;
	ignored: string;
	customDomain: string;
}

export const DEFAULT_SETTINGS: FaviconPluginSettings = {
	provider: 'google',
	ignored: '',
	customDomain: '',
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
					.addOption("splitbee", "Splitbee")
					.addOption("favicongrabber", "FaviconGrabber")
					.addOption("besticon", "The Favicon Finder")
					.addOption("iconhorse", "Icon Horse")
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value;
						await this.plugin.saveSettings();
						this.display();
					})
			});

		if (Array.of("besticon").includes(this.plugin.settings.provider)) {
			new Setting(containerEl)
				.setName('Provider Domain')
				.setDesc('This Provider can be selfhosted, please specify your deployment url. Refer to the readme for deployment instructions.')
				.addText(text => text
					.setValue(this.plugin.settings.customDomain)
					.onChange(async (value) => {
						this.plugin.settings.customDomain = value;
						await this.plugin.saveSettings();
					}));
		}


		new Setting(containerEl)
			.setName('Ignored Domains')
			.setDesc("Don't show an favicon for these domains(one per line)")
			.addTextArea(text => {
					text
						.setValue(this.plugin.settings.ignored)
						.onChange(async (value) => {
							this.plugin.settings.ignored = value;
							await this.plugin.saveSettings();
						})
					text.inputEl.setAttr("rows", 8);
				}
			);
	}
}
