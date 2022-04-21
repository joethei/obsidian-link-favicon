import {Plugin, requestUrl, TFile} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings} from "./settings";
import {IconProvider} from "./provider";
import {getApi} from "@aidenlx/obsidian-icon-shortcodes";
import FastAverageColor from "fast-average-color";
import tinycolor from "tinycolor2";
import {PostProcessor} from "./PostProcessor";

export default class FaviconPlugin extends Plugin {
	settings: FaviconPluginSettings;

	fac = new FastAverageColor();

	async getCustomDomainIcon(domain: string): Promise<string | HTMLImageElement | HTMLSpanElement> {
		const iconApi = getApi(this);
		if (iconApi) {
			const icons = this.settings.overwritten.filter(value => domain.match(value.domain));
			if (icons.length > 0) {
				const icon = icons[0].icon;
				if (iconApi.version.satisfies("^0.9.0")) {
					return await iconApi.getSVGIcon(icon);
				}
				return iconApi.getIcon(icon);
			}
		}
	}

	async getCustomSchemeIcon(scheme: string): Promise<string | HTMLImageElement | HTMLSpanElement> {
		const iconApi = getApi(this);
		if (iconApi) {
			const icons = this.settings.protocol.filter(value => scheme.substr(0, scheme.length - 1).match(value.domain));
			if (icons.length > 0) {
				const icon = icons[0].icon;
				if (iconApi.version.satisfies("^0.9.0")) {
					return await iconApi.getSVGIcon(icon);
				}
				return iconApi.getIcon(icon);
			}
		}
	}

	async getIcon(domain: URL, provider: IconProvider): Promise<string | HTMLImageElement | HTMLSpanElement> {
		if(!domain) return;
		//custom protocols
		if (!domain.protocol.startsWith("http")) {
			const customSchemeIcon = await this.getCustomSchemeIcon(domain.protocol);
			if (customSchemeIcon) {
				if (typeof customSchemeIcon !== "string") {
					customSchemeIcon.addClass("link-favicon");
					customSchemeIcon.dataset.target = domain.href;
					customSchemeIcon.dataset.protocol = domain.protocol;
				}
				return customSchemeIcon;
			}
			return null;
		}

		//filtering out any empty values(otherwise no icons would show up ever)
		const ignoredDomains = this.settings.ignored.split("\n").filter(value => value.length > 0);
		if (ignoredDomains.some(value => domain.hostname.match(new RegExp(value)))) {
			return null;
		}

		//custom domain icons
		const customDomainIcon = await this.getCustomDomainIcon(domain.hostname);
		if (customDomainIcon) {
			if (typeof customDomainIcon !== "string") {
				customDomainIcon.addClass("link-favicon");
				customDomainIcon.dataset.target = domain.href;
				customDomainIcon.dataset.host = domain.hostname;
			}
			return customDomainIcon;
		}

		return provider.url(domain.hostname, this.settings);
	}

	async downloadIcon(icon: string, targetPath: string): Promise<TFile> {
		const buffer = await requestUrl({url: icon});
		const arrayBuffer = buffer.arrayBuffer;
		return this.app.vault.createBinary(targetPath, arrayBuffer);
	}

	async downloadIconToBlob(icon: string, hostname: string): Promise<string> {
		const parts = icon.split(".");
		let extension = parts[parts.length - 1];
		if (extension !== "ico" && extension !== "png") {
			extension = "png";
		}

		const dir = this.app.vault.configDir + "/favicons/";
		if (!await this.app.vault.adapter.exists(dir)) {
			await this.app.vault.adapter.mkdir(dir);
		}
		const filepath = dir + hostname + "." + extension;

		if (!await this.app.vault.adapter.exists(filepath)) {
			await this.downloadIcon(icon, filepath);
			return this.app.vault.adapter.getResourcePath(filepath);
		} else {
			const stat = await this.app.vault.adapter.stat(filepath);
			if (stat.ctime === 0) {
				await this.app.vault.adapter.remove(filepath);
				await this.downloadIcon(icon, filepath);
				return this.app.vault.adapter.getResourcePath(filepath);
			}

			const diff = Date.now() - stat.ctime;
			const time = this.settings.cacheTime * 30 * 24 * 60 * 1000;
			if (diff > time) {
				await this.app.vault.adapter.remove(filepath);
				await this.downloadIcon(icon, filepath);
				return this.app.vault.adapter.getResourcePath(filepath);
			} else {
				return this.app.vault.adapter.getResourcePath(filepath);
			}
		}
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
		try {
			const color = await this.fac.getColorAsync(img);

			img.dataset.averageColorHex = color.hex;
			img.dataset.isDark = String(color.isDark);
			img.dataset.isLight = String(color.isLight);
			const backgroundColor = tinycolor(background);
			img.dataset.readable = tinycolor.readability(color.hex, backgroundColor).toString();
			img.dataset.isReadableAA = String(tinycolor.isReadable(color.hex, backgroundColor));
			img.dataset.isReadableAAA = String(tinycolor.isReadable(color.hex, backgroundColor, {level: "AAA"}));
		}catch (e) {
			console.error("could not extract color information from icon");
			console.error(img);
			console.error(e);
		}

	}

	/**
	 * @returns true if Live Preview is supported
	 */
	isUsingLivePreviewEnabledEditor(): boolean {
		//eslint-disable-next-line @typescript-eslint/no-explicit-any
		const config = (this.app.vault as any).config;
		if (config.legacyEditor === undefined) return false;
		return !config.legacyEditor;
	}

	async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();

		this.addSettingTab(new FaviconSettings(this.app, this));
		if (this.isUsingLivePreviewEnabledEditor()) {
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const asyncDecoBuilderExt = require('./decoration/Decorations').asyncDecoBuilderExt;
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const Prec = require("@codemirror/state").Prec;
			this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
		}

		const processor = new PostProcessor(this);
		this.registerMarkdownPostProcessor(processor.processor);
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
