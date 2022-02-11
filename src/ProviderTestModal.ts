import FaviconPlugin from "./main";
import {Modal, Setting} from "obsidian";
import {providers} from "./provider";

export class ProviderTestModal extends Modal {
	plugin: FaviconPlugin;
	link: string;

	constructor(plugin: FaviconPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	async display(): Promise<void> {

		const {contentEl} = this;

		contentEl.empty();

		new Setting(contentEl).setName("Link").addText(text => {
			text
				.setValue(this.link)
				.onChange(value => {
					this.link = value;
				});
		});
		new Setting(contentEl).setName("Show Favicon").addButton(button => {
			button
				.setButtonText("Apply")
				.onClick(() => {
					this.display();
				});
		});

		if(this.link) {
			try {
				const url = new URL(this.link);

				for (const provider of Object.values(providers)) {
					contentEl.createEl("h3", {text: provider.name});
					const preview = contentEl.createEl("img", {cls: "provider-preview"});
					preview.setAttribute("src", await provider.url(url.hostname, this.plugin.settings));
				}
			}catch (e) {
				contentEl.createSpan({text: "Not a valid URL"});
			}

		}


	}

	async onOpen(): Promise<void> {
		await this.display();
	}
}
