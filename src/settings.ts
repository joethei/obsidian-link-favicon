import {App, Notice, PluginSettingTab, SettingGroup} from "obsidian";
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

		this.addProviderGroup(containerEl);
		this.addDesignGroup(containerEl);
		this.addCustomIconGroups(containerEl);
		this.addAdvancedGroup(containerEl);
		this.addDebugGroup(containerEl);
	}

	private addProviderOptions(dropdown: {addOption(value: string, display: string): unknown}): void {
		for (const id in providers) {
			if (Object.prototype.hasOwnProperty.call(providers, id)) {
				dropdown.addOption(id, providers[id].name);
			}
		}
	}

	private addProviderGroup(containerEl: HTMLElement): void {
		const group = new SettingGroup(containerEl).setHeading("Icon providers");

		group.addSetting((setting) => {
			setting
				.setName("Icon provider")
				.addDropdown((dropdown) => {
					this.addProviderOptions(dropdown);
					dropdown
						.setValue(this.plugin.settings.provider)
						.onChange(async (value) => {
							this.plugin.settings.provider = value;
							await this.plugin.saveSettings();
							this.display();
						})
				});
		});

		if (Array.of("besticon").includes(this.plugin.settings.provider)) {
			group.addSetting((setting) => {
				setting
					.setName('Provider domain')
					.setDesc('This provider is selfhosted, please specify your deployment URL. Refer to the readme of the provider for deployment instructions.')
					.addText(text => text
						.setValue(this.plugin.settings.providerDomain)
						.onChange(async (value) => {
							this.plugin.settings.providerDomain = value;
							await this.plugin.saveSettings();
						}));
			});
		}

		group.addSetting((setting) => {
			setting
				.setName("Fallback icon provider")
				.addDropdown((dropdown) => {
					this.addProviderOptions(dropdown);
					dropdown
						.setValue(this.plugin.settings.fallbackProvider)
						.onChange(async (value) => {
							this.plugin.settings.fallbackProvider = value;
							await this.plugin.saveSettings();
							this.display();
						})
				});
		});

		if (Array.of("besticon").includes(this.plugin.settings.fallbackProvider)) {
			group.addSetting((setting) => {
				setting
					.setName('Fallback provider domain')
					.setDesc('This provider is be selfhosted, please specify your deployment URL. Refer to the readme of the provider for deployment instructions.')
					.addText(text => text
						.setValue(this.plugin.settings.fallbackProviderDomain)
						.onChange(async (value) => {
							this.plugin.settings.fallbackProviderDomain = value;
							await this.plugin.saveSettings();
						}));
			});
		}

		group.addSetting((setting) => {
			setting
				.setName('Not sure which provider to choose?')
				.addButton(button =>
					button.setButtonText("Test providers")
						.onClick(() => {
							new ProviderTestModal(this.plugin).open();
						})
				);
		});

		group.addSetting((setting) => {
			setting
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
		});
	}

	private addDesignGroup(containerEl: HTMLElement): void {
		const group = new SettingGroup(containerEl).setHeading("Design");

		group.addSetting((setting) => {
			setting
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
		});

		group.addSetting((setting) => {
			setting
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
		});

		group.addSetting((setting) => {
			setting
				.setName('Show in reading mode')
				.addToggle(toggle => {
					toggle
						.setValue(this.plugin.settings.enableReading)
						.onChange(async (value) => {
							this.plugin.settings.enableReading = value;
							await this.plugin.saveSettings();
						});
				});
		});

		group.addSetting((setting) => {
			setting
				.setName('Show in source mode')
				.addToggle(toggle => {
					toggle
						.setValue(this.plugin.settings.enableSource)
						.onChange(async (value) => {
							this.plugin.settings.enableSource = value;
							await this.plugin.saveSettings();
						});
				});
		});

		group.addSetting((setting) => {
			setting
				.setName('Show in live preview')
				.addToggle(toggle => {
					toggle
						.setValue(this.plugin.settings.enableLivePreview)
						.onChange(async (value) => {
							this.plugin.settings.enableLivePreview = value;
							await this.plugin.saveSettings();
						});
				});
		});

		group.addSetting((setting) => {
			setting
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
		});

		group.addSetting((setting) => {
			setting
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
		});
	}

	private addCustomIconGroups(containerEl: HTMLElement): void {
		const iconAPI = getApi(this.plugin);
		if (!iconAPI) {
			return;
		}

		const domainGroup = new SettingGroup(containerEl).setHeading("Custom icons for domains");
		domainGroup.addSetting((setting) => {
			setting
				.setName("Add new")
				.setDesc("Add custom icon")
				.addButton((button) => {
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
		});

		for (const overwritten of this.plugin.settings.overwritten) {
			domainGroup.addSetting((setting) => {
				const desc = new DocumentFragment();
				const icon = iconAPI.getIcon(overwritten.icon);
				const paragraph = desc.createEl("p", {text: "		" + overwritten.icon});
				if (icon) {
					paragraph.prepend(icon);
				}

				setting
					.setName(overwritten.domain)
					.setDesc(desc)
					.addExtraButton((button) => {
						button.setIcon("pencil")
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
					.addExtraButton((button) => {
						button.setIcon("trash")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.overwritten = this.plugin.settings.overwritten.filter((tmp) => {
									return overwritten.domain !== tmp.domain;
								});
								await this.plugin.saveSettings();
								this.display();
							});
					});
			});
		}

		const protocolGroup = new SettingGroup(containerEl).setHeading("Custom icons for uri schemas");
		protocolGroup.addSetting((setting) => {
			setting
				.setName("Add new")
				.setDesc("Add custom icon")
				.addButton((button) => {
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
		});

		for (const protocol of this.plugin.settings.protocol) {
			protocolGroup.addSetting((setting) => {
				const desc = new DocumentFragment();
				const icon = iconAPI.getIcon(protocol.icon);
				const paragraph = desc.createEl("p", {text: "		" + protocol.icon});
				if (icon) {
					paragraph.prepend(icon);
				}

				setting
					.setName(protocol.domain)
					.setDesc(desc)
					.addExtraButton((button) => {
						button.setIcon("pencil")
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
					.addExtraButton((button) => {
						button.setIcon("trash")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.protocol = this.plugin.settings.protocol.filter((overwritten) => {
									return overwritten.domain !== protocol.domain;
								});
								await this.plugin.saveSettings();
								this.display();
							});
					});
			});
		}
	}

	private addAdvancedGroup(containerEl: HTMLElement): void {
		const group = new SettingGroup(containerEl).setHeading("Advanced");

		group.addSetting((setting) => {
			setting
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
		});
	}

	private addDebugGroup(containerEl: HTMLElement): void {
		if(this.app.loadLocalStorage('debug-plugin') !== '1') {
			return;
		}

		const storage = activeWindow.localStorage;
		const group = new SettingGroup(containerEl).setHeading("Debugging tools");

		group.addSetting((setting) => {
			setting.setName("Cached icons");

			const desc = new DocumentFragment();
			desc.createEl('p', {text: 'Only use these tools if you know what you are doing'});
			Object.keys(storage).forEach((key) => {
				if(key.startsWith("lf-")) {
					desc.createEl('p', {text: key});
					desc.createEl('img', {attr: {src: ls.get<string>(key) ?? ""}});
				}
			});

			setting.setDesc(desc);
		});

		group.addSetting((setting) => {
			setting
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
		});
	}
}
