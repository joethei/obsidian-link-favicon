import {App, PluginSettingTab, Setting} from "obsidian";
import FaviconPlugin from "./main";
import IconProvider from "./provider";

export interface FaviconPluginSettings {
	provider: string;
	fallbackProvider: string;
	providerDomain: string;
	fallbackProviderDomain: string;
	ignored: string;
}

export const DEFAULT_SETTINGS: FaviconPluginSettings = {
	provider: 'duckduckgo',
	fallbackProvider: 'google',
	providerDomain: '',
	fallbackProviderDomain: '',
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
				for(const provider of IconProvider.providers) {
					dropdown.addOption(provider.id, provider.name);
				}
				dropdown
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
				.setDesc('This Provider is be selfhosted, please specify your deployment url. Refer to the readme of the provider for deployment instructions.')
				.addText(text => text
					.setValue(this.plugin.settings.providerDomain)
					.onChange(async (value) => {
						this.plugin.settings.providerDomain = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName("Fallback Icon Provider")
			.addDropdown((dropdown) => {
				for(const provider of IconProvider.providers) {
					dropdown.addOption(provider.id, provider.name);
				}
				dropdown
					.setValue(this.plugin.settings.fallbackProvider)
					.onChange(async (value) => {
						this.plugin.settings.fallbackProvider = value;
						await this.plugin.saveSettings();
						this.display();
					})
			});

		if (Array.of("besticon").includes(this.plugin.settings.fallbackProvider)) {
			new Setting(containerEl)
				.setName('Fallback Provider Domain')
				.setDesc('This Provider is be selfhosted, please specify your deployment url. Refer to the readme of the provider for deployment instructions.')
				.addText(text => text
					.setValue(this.plugin.settings.fallbackProviderDomain)
					.onChange(async (value) => {
						this.plugin.settings.fallbackProviderDomain = value;
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
