import {App, ButtonComponent, Notice, PluginSettingTab, Setting} from "obsidian";
import FaviconPlugin from "./main";
import {providers} from "./provider";
import {OverwrittenIconModal} from "./OverwrittenIconModal";
import {getApi} from "@aidenlx/obsidian-icon-shortcodes";
import {ProviderTestModal} from "./ProviderTestModal";
import ls from "localstorage-slim";

export interface OverwrittenFavicon {
	domain: string,
	icon: string,
}

export interface FaviconPluginSettings {
	provider: string;
	fallbackProvider: string;
	providerDomain: string;
	fallbackProviderDomain: string;
	ignored: string;
	overwritten: OverwrittenFavicon[];
	protocol: OverwrittenFavicon[];
	showAliased: boolean;
	showLink: boolean;
	enableReading: boolean,
	enableSource: boolean,
	enableLivePreview: boolean,
	debounce: number,
	iconPosition: string,
	colorInversion: boolean,
}

export const DEFAULT_SETTINGS: FaviconPluginSettings = {
	provider: 'duckduckgo',
	fallbackProvider: 'google',
	providerDomain: '',
	fallbackProviderDomain: '',
	ignored: '',
	overwritten: [],
	protocol: [],
	showAliased: true,
	showLink: true,
	enableReading: true,
	enableSource: true,
	enableLivePreview: true,
	debounce: 500,
	iconPosition: 'front',
	colorInversion: true,
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

		new Setting(containerEl)
			.setName("Icon provider")
			.addDropdown((dropdown) => {
				for (const id in providers) {
						if (Object.prototype.hasOwnProperty.call(providers, id)) {
						dropdown.addOption(id, providers[id].name);
					}
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
				.setName('Provider domain')
					.setDesc('This provider is selfhosted, please specify your deployment URL. Refer to the readme of the provider for deployment instructions.')
				.addText(text => text
					.setValue(this.plugin.settings.providerDomain)
					.onChange(async (value) => {
						this.plugin.settings.providerDomain = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName("Fallback icon provider")
			.addDropdown((dropdown) => {
				for (const id in providers) {
						if (Object.prototype.hasOwnProperty.call(providers, id)) {
						dropdown.addOption(id, providers[id].name);
					}
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
				.setName('Fallback provider domain')
					.setDesc('This provider is be selfhosted, please specify your deployment URL. Refer to the readme of the provider for deployment instructions.')
				.addText(text => text
					.setValue(this.plugin.settings.fallbackProviderDomain)
					.onChange(async (value) => {
						this.plugin.settings.fallbackProviderDomain = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName('Not sure which provider to choose?')
			.addButton(button =>
					button.setButtonText("Test providers")
					.onClick(() => {
						new ProviderTestModal(this.plugin).open();
					})
			);


		new Setting(containerEl)
			.setName('Ignored domains')
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

		new Setting(containerEl).setName("Design").setHeading();

		new Setting(containerEl)
			.setName('Show icon when link has alias')
				.setDesc('When link is formatted like: [Obsidian](HTTPS://Obsidian.md/)')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.showAliased)
					.onChange(async (value) => {
						this.plugin.settings.showAliased = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Show icon when link has no alias')
				.setDesc('When link is formatted like: https://Obsidian.md/')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.showLink)
					.onChange(async (value) => {
						this.plugin.settings.showLink = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("hr");

		new Setting(containerEl)
				.setName('Show in reading mode')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.enableReading)
					.onChange(async (value) => {
						this.plugin.settings.enableReading = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
				.setName('Show in source mode')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.enableSource)
					.onChange(async (value) => {
						this.plugin.settings.enableSource = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Show in live preview')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.enableLivePreview)
					.onChange(async (value) => {
						this.plugin.settings.enableLivePreview = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
				.setName("Icon position")
			.addDropdown(dropdown => {
				dropdown
					.addOption('front', "Before the link")
					.addOption('back', "After the link")
					.setValue(this.plugin.settings.iconPosition)
					.onChange(async(value) => {
						this.plugin.settings.iconPosition = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Color inversion')
			.setDesc('Favicon colors will be automatically inverted if the icon is detected to be less readable')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.colorInversion)
					.onChange(async value => {
						this.plugin.settings.colorInversion = value;
						await this.plugin.saveSettings();
					});
			});

			const iconAPI = getApi(this.plugin);
			if (iconAPI) {
			new Setting(containerEl).setName("Custom icons").setHeading();

				new Setting(containerEl).setName("For domains").setHeading();

			new Setting(containerEl)
				.setName("Add new")
					.setDesc("Add custom icon")
				.addButton((button: ButtonComponent): ButtonComponent => {
					return button
						.setTooltip("Add custom icon")
						.setIcon("plus-with-circle")
						.onClick(() => {
							const modal = new OverwrittenIconModal(this.plugin);

							modal.onClose = () => {
								void (async () => {
								if (modal.saved) {
									this.plugin.settings.overwritten.push({
										domain: modal.domain,
										icon: modal.icon
									});
									await this.plugin.saveSettings();

									this.display();
								}
								})();
							};

							modal.open();
						});
				});


			const overwrittenContainer = containerEl.createDiv("overwritten");

			const overwrittenDiv = overwrittenContainer.createDiv("overwritten");
			for (const overwritten of this.plugin.settings.overwritten) {
				const setting = new Setting(overwrittenDiv);

				const desc = new DocumentFragment();
				desc.createEl("p", {text: "		" + overwritten.icon}).prepend(iconAPI.getIcon(overwritten.icon)!);

				setting
					.setName(overwritten.domain)
					.setDesc(desc)
					.addExtraButton((b) => {
						b.setIcon("pencil")
							.setTooltip("Edit")
								.onClick(() => {
									const modal = new OverwrittenIconModal(this.plugin, overwritten);

									modal.onClose = () => {
										void (async () => {
										if (modal.saved) {
											const setting = this.plugin.settings.overwritten.filter((overwritten) => {
												return overwritten.domain !== modal.domain;
										})
										setting.push({domain: modal.domain, icon: modal.icon});
										this.plugin.settings.overwritten = setting;
										await this.plugin.saveSettings();

											this.display();
										}
										})();
									};

									modal.open();
							});
					})
					.addExtraButton((b) => {
						b.setIcon("trash")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.overwritten = this.plugin.settings.overwritten.filter((tmp) => {
									return overwritten.domain !== tmp.domain;
								});
								await this.plugin.saveSettings();
								this.display();
							});
					});


			}


				new Setting(containerEl).setName("For uri schemas").setHeading();

			new Setting(containerEl)
				.setName("Add new")
					.setDesc("Add custom icon")
				.addButton((button: ButtonComponent): ButtonComponent => {
					return button
						.setTooltip("Add custom icon")
						.setIcon("plus-with-circle")
						.onClick(() => {
							const modal = new OverwrittenIconModal(this.plugin, null, "URI Schema");

							modal.onClose = () => {
								void (async () => {
								if (modal.saved) {
									this.plugin.settings.protocol.push({
										domain: modal.domain,
										icon: modal.icon
									});
									await this.plugin.saveSettings();

									this.display();
								}
								})();
							};

							modal.open();
						});
				});


			const protocolContainer = containerEl.createDiv("overwritten");

			const protocolDiv = protocolContainer.createDiv("overwritten");
			for (const protocol of this.plugin.settings.protocol) {
				const setting = new Setting(protocolDiv);

				const desc = new DocumentFragment();
				desc.createEl("p", {text: "		" + protocol.icon}).prepend(iconAPI.getIcon(protocol.icon)!);

				setting
					.setName(protocol.domain)
					.setDesc(desc)
					.addExtraButton((b) => {
						b.setIcon("pencil")
							.setTooltip("Edit")
								.onClick(() => {
									const modal = new OverwrittenIconModal(this.plugin, protocol, "URI Schema");

									modal.onClose = () => {
										void (async () => {
										if (modal.saved) {
											const setting = this.plugin.settings.protocol.filter((overwritten) => {
												return overwritten.domain !== modal.domain;
										})
										setting.push({domain: modal.domain, icon: modal.icon});
										this.plugin.settings.protocol = setting;
											await this.plugin.saveSettings();
											this.display();
										}
										})();
									};

									modal.open();
							});
					})
					.addExtraButton((b) => {
						b.setIcon("trash")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.protocol = this.plugin.settings.protocol.filter((overwritten) => {
									return overwritten.domain !== protocol.domain;
								});
								await this.plugin.saveSettings();
								this.display();
							});
					});


			}

			const details = containerEl.createEl("details");
			details.createEl("summary", {text: 'Advanced'});
			const advanced = details.createDiv("advanced");

			new Setting(advanced)
				.setName('Debounce')
				.setDesc('How fast after editing a link should a icon be displayed(in milliseconds)?')
				.addSlider(slider => {
					slider
						.setLimits(1, 2500, 1)
						.setDynamicTooltip()
						.setValue(this.plugin.settings.debounce)
						.onChange(async (value) => {
							this.plugin.settings.debounce = value;
							await this.plugin.saveSettings();
						});
				});

		}

			const storage = activeWindow.localStorage;
			if(this.app.loadLocalStorage('debug-plugin') === '1') {
			new Setting(containerEl).setName("Debugging tools").setHeading();
			containerEl.createEl('p', {text: 'Only use these tools if you know what you are doing'});

			const cachedDetails = containerEl.createEl('details');
			cachedDetails.createEl('summary', {text: 'Cached icons'});
			const cached = cachedDetails.createDiv('cached');
				Object.keys(storage).forEach((key) => {
				if(key.startsWith("lf-")) {
					cached.createEl('p', {text: key});
					cached.createEl('img', {attr: {src: ls.get(key)}});
				}
			});

			new Setting(containerEl)
				.setName('Clear icon cache')
				.setDesc('Remove all icons from cache')
				.addButton(button => {
					button.setButtonText('Clear')
						.onClick(() => {
								Object.keys(storage).forEach((key) => {
									if(key.startsWith("lf-")) {
										storage.removeItem(key);
								}
							});
							new Notice("Cleared cache");
							this.display();
						});
				});
			}
	}
}
