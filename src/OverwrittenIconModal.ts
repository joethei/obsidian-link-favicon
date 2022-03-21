import FaviconPlugin from "./main";
import {Modal, Notice, Setting} from "obsidian";
import {OverwrittenFavicon} from "./settings";
import {getApi, isPluginEnabled} from "@aidenlx/obsidian-icon-shortcodes";
import {SchemaSuggest} from "./SchemaSuggest";


export class OverwrittenIconModal extends Modal {
	plugin: FaviconPlugin;
	domain: string;
	icon: string;
	name = "Domain";

	saved: boolean;

	constructor(plugin: FaviconPlugin, map?: OverwrittenFavicon, name?: string) {
		super(plugin.app);
		this.plugin = plugin;

		if(name) {
			this.name = name;
		}

		if(map) {
			this.domain = map.domain;
			this.icon = map.icon;
		}
	}

	async displayPreview(contentEl: HTMLElement) : Promise<void> {
		if(isPluginEnabled(this.plugin) && this.icon) {
			contentEl.empty();
			const iconPreview = contentEl.createDiv("preview");
			iconPreview.addClass("link-favicon-preview");
			const iconApi = getApi(this.plugin);
			const icon = iconApi.getIcon(this.icon, false);
			if(icon !== null)
				iconPreview.append(icon);
		}
	}

	async display() : Promise<void> {

		const { contentEl } = this;

		contentEl.empty();

		//eslint-disable-next-line prefer-const
		let previewEL: HTMLElement;

		const nameSetting = new Setting(contentEl).setName(this.name);

		if(this.name !== "Domain") {
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			let schemas: {schema: string, Description: string}[] = require("../schemas.json");
			//we don't need http/https to show up, they would not work here
			schemas = schemas.filter(item => !item.schema.contains("http"));
			const schemaNames = Object.values(schemas).map(schema => schema.schema);
			const descriptions = Object.values(schemas).map(schema => {
				return {name: schema.schema, description: schema.Description}
			});
			nameSetting.addSearch(search => {
				new SchemaSuggest(this.plugin.app, search.inputEl, new Set<string>(schemaNames), new Set<{name: string, description: string}>(descriptions));
					search.setValue(this.domain)
					.onChange(value => {
						this.domain = value;
					});
			});
		}else {
			nameSetting.addText((text) => {
				text
					.setValue(this.domain)
					.onChange((value) => {
						this.domain = value;
					});
			});
		}



		const api = getApi(this.plugin);
		if (api) {
			if (api.version.compare(">=", "0.6.1")) {

				new Setting(contentEl)
					.setName("Icon")
					.addButton((button) => {
						button
							.setButtonText("Choose")
							.onClick(async() => {
								const icon = await api.getIconFromUser();
								if(icon) {
									this.icon = icon.id;
									if(previewEL) {
										await this.displayPreview(previewEL);
									}
								}
							});
					});

			}else {
				new Setting(contentEl)
					.setName("Icon")
					.addText((text) => {
						text
							.setValue(this.icon)
							.onChange(async(value) => {
								this.icon = value;
								if(previewEL) {
									await this.displayPreview(previewEL);
								}
							});
					});
			}
		}

		previewEL = contentEl.createDiv("preview");

		await this.displayPreview(previewEL);

		const footerEl = contentEl.createDiv();
		const footerButtons = new Setting(footerEl);
		footerButtons.addButton((b) => {
			b.setTooltip("Save")
				.setIcon("checkmark")
				.onClick(async () => {
					if(this.icon && this.domain) {
						this.saved = true;
						this.close();
					}else {
						new Notice("Please supply both a " + this.name + " & a icon");
					}

				});
			return b;
		});
		footerButtons.addExtraButton((b) => {
			b.setIcon("cross")
				.setTooltip("Cancel")
				.onClick(() => {
					this.saved = false;
					this.close();
				});
			return b;
		});
	}

	async onOpen() : Promise<void> {
		await this.display();
	}
}
