import {Platform, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";
import {IconProvider, providers} from "./provider";
import {getApi, isPluginEnabled} from "@aidenlx/obsidian-icon-shortcodes";
import {Prec} from "@codemirror/state";
import {asyncDecoBuilderExt} from "./Decorations";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	isDisabled(el: Element) {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
	}


	getCustomDomainIcon(domain: string): string | HTMLImageElement {
		if (isPluginEnabled(this)) {
			const icons = this.settings.overwritten.filter(value => value.domain === domain);
			if (icons.length > 0) {
				const iconApi = getApi(this);
				const icon = icons[0].icon;
				return iconApi.getIcon(icon, false);
			}
		}
	}

	getCustomSchemeIcon(scheme: string): string | HTMLImageElement {
		if (isPluginEnabled(this)) {
			const icons = this.settings.protocol.filter(value => value.domain === scheme.substr(0, scheme.length - 1));
			if (icons.length > 0) {
				const iconApi = getApi(this);
				const icon = icons[0].icon;
				return iconApi.getIcon(icon, false);
			}
		}
	}

	async getIcon(domain: URL, provider: IconProvider): Promise<string | HTMLImageElement> {
		//custom protocols
		if (!domain.protocol.startsWith("http")) {
			const customSchemeIcon = this.getCustomSchemeIcon(domain.protocol);
			if (customSchemeIcon) {
				if (typeof customSchemeIcon !== "string") {
					customSchemeIcon.addClass("link-favicon");
					customSchemeIcon.dataset.host = domain.hostname;
				}
				return customSchemeIcon;
			}
			return null;
		}

		if (this.settings.ignored.split("\n").contains(domain.hostname)) {
			return null;
		}

		//custom domain icons
		const customDomainIcon = this.getCustomDomainIcon(domain.hostname);
		if (customDomainIcon) {
			if (typeof customDomainIcon !== "string") {
				customDomainIcon.addClass("link-favicon");
				customDomainIcon.dataset.host = domain.hostname;
			}
			return customDomainIcon;
		}

		return provider.url(domain.hostname, this.settings);
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));
		if((this.app.vault as any).config?.livePreview) {
			this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
		}

		this.registerMarkdownPostProcessor(async (element, ctx) => {
			if (ctx.sourcePath.contains("no-favicon")) {
				return;
			}

			const provider = providers[this.settings.provider];
			const fallbackProvider = providers[this.settings.fallbackProvider];

			if (!provider || !fallbackProvider) {
				console.error("Link Favicons: misconfigured providers");
				return;
			}

			const links = element.querySelectorAll("a.external-link:not([data-favicon])");
			for (let index = 0; index < links.length; index++) {
				const link = links.item(index) as HTMLAnchorElement;
				if (!this.isDisabled(link)) {
					link.dataset.favicon = "true";

					let domain;

					try {
						domain = new URL(link.href);
					} catch (e) {
						console.error("Invalid url: " + link.href);
						console.error(e);
					}

					if (!domain) continue;

					const icon = await this.getIcon(domain, provider);
					const fallbackIcon = await this.getIcon(domain, fallbackProvider);

					let el: string | HTMLObjectElement | HTMLImageElement;

					if (!icon || icon === "") {
						console.log("no icon for " + domain.href);
						continue;
					}

					if (typeof icon === "string") {
						if (!icon.startsWith("http")) {
							el = icon;
						} else {
							//html only image fallback taken from: https://dev.to/albertodeago88/html-only-image-fallback-19im
							el = document.createElement("object");
							el.addClass("link-favicon");
							el.dataset.host = domain.hostname;
							el.data = icon;

							/*if (typeof el !== "string") {
								const tmpImg = document.createElement("img");
								tmpImg.crossOrigin = 'anonymous';
								tmpImg.src = icon;
								fac.getColorAsync(tmpImg).then(color => {
									console.log(color.hex);
									if (typeof el !== "string") {
										el.dataset.averageColor = color.rgb;
									}
									link.append(tmpImg);
								}).catch(e => {
									console.error(e);
								}).finally(() => {
									tmpImg.remove();
								});
							}*/

							//only png and icon are ever used by any provider
							el.data.contains(".ico") ? el.type = "image/x-icon" : el.type = "image/png";

							//making sure these styles will not be overwritten by any other theme/plugin
							//i.e. page preview sets height: auto, which creates huge icons.
							el.style.height = "0.8em";
							el.style.display = "inline-block";
						}

					} else {
						el = icon;
					}

					if (!el) continue;

					if (typeof el !== "string" && typeof fallbackIcon === "string") {
						const img = el.createEl("img");
						//img.crossOrigin = "anonymous";
						img.src = fallbackIcon;
						img.addClass("link-favicon");
						/*fac.getColorAsync(img).then(color => {
							img.dataset.averageColor = color.hex;
						}).catch(e => {
							console.error(e);
						});*/
						img.style.height = "0.8em";
						img.style.display = "block";

						el.append(img);
					}

					if (el) {
						link.prepend(el);
					}
				}
			}
		});
	}

	onunload() {
		//fac.destroy();
		console.log("disabling plugin: link favicons");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
