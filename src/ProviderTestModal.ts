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
		contentEl.addClass("link-favicon-scrollable-content");

		new Setting(contentEl).setName("Link").addText(text => {
			text
				.setValue(this.link)
				.onChange(value => {
					this.link = value;
				});
			text.inputEl.addEventListener('keydown', (event) => {
				if (event.key === 'Enter') {
						void this.display();
				}
			});
		});
		new Setting(contentEl).setName("").addButton(button => {
			button
				.setButtonText("Test")
				.onClick(() => {
						void this.display();
				});
		});

		if(this.link) {
			if(!this.link.startsWith("http")) {
				this.link = "http://" + this.link;
			}
			try {
				const url = new URL(this.link);

				for (const provider of Object.values(providers)) {
					contentEl.createEl("h3", {text: provider.name});
					const preview = contentEl.createEl("img", {cls: "provider-preview"});
					preview.setAttribute("src", await provider.url(url.hostname, this.plugin.settings));
				}
			}catch {
				contentEl.createSpan({text: "Could not generate favicon, check your settings"});
			}

		}


	}

	override onOpen(): void {
		void this.display();
	}
}
