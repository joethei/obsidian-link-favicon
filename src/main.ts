import {Plugin, requireApiVersion} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";
import {IconProvider, providers} from "./provider";
import {getApi, isPluginEnabled} from "@aidenlx/obsidian-icon-shortcodes";
import FastAverageColor from "fast-average-color";
import tinycolor from "tinycolor2";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	fac = new FastAverageColor();

	isDisabled(el: Element) {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
		if (!this.settings.showLink && el.textContent === el.getAttribute("href")) return true;
		if (!this.settings.showAliased && el.textContent !== el.getAttribute("href")) return true;
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

	async downloadIconToBlob(icon: string): Promise<string> {
		//@ts-ignore
		const buffer = await requestUrl({url: icon});
		const arrayBuffer = buffer.arrayBuffer;
		const arrayBufferView = new Uint8Array(arrayBuffer);
		const blob = new Blob([arrayBufferView], {type: "image/png"});
		return await this.blobToBase64(blob);
	}

	async setColorAttributes(img: HTMLImageElement) {
		const darkEl = document.getElementsByClassName("theme-dark")[0];
		const lightEl = document.getElementsByClassName("theme-light")[0];

		//@ts-ignore
		const isDarkMode = app.getTheme() === "obsidian";
		let background: string;

		if (isDarkMode) {
			const style = window.getComputedStyle(darkEl);
			background = style.getPropertyValue('--background-primary');
		} else {
			const style = window.getComputedStyle(lightEl);
			background = style.getPropertyValue('--background-primary');
		}

		this.fac.getColorAsync(img).then(color => {
			img.dataset.averageColorRgb = color.rgb;
			img.dataset.averageColorRgba = color.rgba;
			img.dataset.averageColorHex = color.hex;
			img.dataset.averageColorHexa = color.hexa;
			img.dataset.isDark = String(color.isDark);
			img.dataset.isLight = String(color.isLight);
			const backgroundColor = tinycolor(background);
			img.dataset.readable = tinycolor.readability(color.hex, backgroundColor).toString();
			img.dataset.isReadableAA = String(tinycolor.isReadable(color.hex, backgroundColor));
			img.dataset.isReadableAAA = String(tinycolor.isReadable(color.hex, backgroundColor, {level: "AAA"}));
		}).catch(e => {
			console.error(e);
		});
	}

	isLivePreviewSupported() : boolean {
		//eslint-disable-next-line @typescript-eslint/no-explicit-any
		const config = (this.app.vault as any).config;
		if(config.legacyEditor === undefined) return false;
		if(config.legacyEditor) return false;
		if(typeof requireApiVersion !== "function") return false;
		if(!requireApiVersion("0.13.0")) return false;
		return true;
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.addSettingTab(new FaviconSettings(this.app, this));
		if (this.isLivePreviewSupported()) {
			console.log("live preview supported");
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const asyncDecoBuilderExt = require('./Decorations').asyncDecoBuilderExt;
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const Prec = require("@codemirror/state").Prec;
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

							if (!this.isLivePreviewSupported() && ( typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25"))) {
								el.data = icon;
							} else {
								const blob = await this.downloadIconToBlob(icon);
								el.data = blob;


								if (typeof el !== "string") {
									const tmpImg = document.createElement("img");
									tmpImg.crossOrigin = 'anonymous';
									tmpImg.src = blob;

									await this.setColorAttributes(tmpImg);
									for (const data of Object.keys(tmpImg.dataset)) {
										el.dataset[data] = tmpImg.dataset[data];
									}
								}
							}

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
						img.addClass("link-favicon");

						if (!this.isLivePreviewSupported() && ( typeof requireApiVersion !== "function" || !requireApiVersion("0.13.25"))) {
							img.src = fallbackIcon;
						}else {
							img.src = await this.downloadIconToBlob(fallbackIcon);
							await this.setColorAttributes(img);
						}

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

	blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, _) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.readAsDataURL(blob);
		});
	}

	findOpenParen(text: string, closePos: number): number {
		if(!text.includes("[")) return 0;
		let openPos = closePos;
		let counter = 1;
		while (counter > 0) {
			const c = text[--openPos];
			if(c === undefined) break;
			if (c == '[') {
				counter--;
			} else if (c == ']') {
				counter++;
			}
		}
		return openPos;
	}

	onunload() {
		this.fac.destroy();
		console.log("disabling plugin: link favicons");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
