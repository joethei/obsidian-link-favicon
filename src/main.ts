import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FaviconPluginSettings, FaviconSettings, OverwrittenFavicon} from "./settings";
import {IconProvider} from "./provider";
import {getApi} from "@aidenlx/obsidian-icon-shortcodes";
import {PostProcessor} from "./PostProcessor";
import {textRemovingDecoration} from "./decoration/text/TextRemovingDecoration";
import {IconElement} from "./types";
import {IconAdder} from "./IconAdder";

export default class FaviconPlugin extends Plugin {
	settings!: FaviconPluginSettings;
	iconAdder!: IconAdder;

	private async getOverwrittenFavicon(favicons: OverwrittenFavicon[]) {
		const iconApi = getApi(this);
		if (!iconApi) return Promise.reject("No IconAPI loaded");
		if (favicons.length === 0) return Promise.reject("No icons");

		const icon = favicons[0].icon;
		if (iconApi.version.satisfies("^0.9.0")) {
			const result = await iconApi.getSVGIcon(icon);
			if (result) return result;
			return Promise.reject();
		}
		const result = await iconApi.getIcon(icon);
		if (result) return result;
		return Promise.reject();

	}

	async getCustomDomainIcon(domain: string): Promise<IconElement | undefined> {
		const icons = this.settings.overwritten.filter(value => domain.match(value.domain));
		return this.getOverwrittenFavicon(icons).then(res => res).catch(e => undefined);
	}

	async getCustomSchemeIcon(scheme: string): Promise<IconElement | undefined> {
		const icons = this.settings.protocol.filter(value => scheme.substr(0, scheme.length - 1).match(value.domain));
		return this.getOverwrittenFavicon(icons).then(res => res).catch(e => undefined);

	}

	async getIcon(link: string, provider: IconProvider): Promise<IconElement> {

		let url: URL;
		try {
			url = new URL(link);
		} catch (e) {
			return Promise.reject();
		}

		//custom protocols
		const customSchemeIcon = await this.getCustomSchemeIcon(url.protocol);
		if (customSchemeIcon) {
			if (typeof customSchemeIcon !== "string") {
				customSchemeIcon.addClass("link-favicon");
				customSchemeIcon.dataset.target = url.href;
				customSchemeIcon.dataset.protocol = url.protocol;
			}
			return customSchemeIcon;
		}


		//filtering out any empty values(otherwise no icons would show up ever)
		const ignoredDomains = this.settings.ignored.split("\n").filter(value => value.length > 0);
		if (ignoredDomains.some(value => url.hostname.match(new RegExp(value)))) {
			return Promise.reject();
		}

		//custom domain icons
		const customDomainIcon = await this.getCustomDomainIcon(url.hostname);
		if (customDomainIcon) {
			if (typeof customDomainIcon !== "string") {
				customDomainIcon.addClass("link-favicon");
				customDomainIcon.dataset.target = url.href;
				customDomainIcon.dataset.host = url.hostname;
			}
			return customDomainIcon;
		}

		try {
			return await provider.url(url.hostname, this.settings);
		} catch (e) {
			console.error(e);
			return Promise.reject();
		}
		return "";
	}

	/**
	 * @returns true if Live Preview is supported
	 */
	isUsingLivePreviewEnabledEditor(): boolean {
		//@ts-ignore
		return !app.vault.getConfig('legacyEditor');
	}

	override async onload() {
		console.log("enabling plugin: link favicons");
		await this.loadSettings();
		this.iconAdder = new IconAdder(this);

		const dir = this.app.vault.configDir + "/favicons/";
		if (await this.app.vault.adapter.exists(dir)) {
			await this.app.vault.adapter.rmdir(dir, true);
		}

		//respond to app events to fix #37
		this.registerEvent(this.app.workspace.on('css-change', () => {
			this.app.workspace.updateOptions();
		}));

		this.addSettingTab(new FaviconSettings(this.app, this));

		if (this.isUsingLivePreviewEnabledEditor()) {
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const asyncDecoBuilderExt = require('./decoration/icon/IconDecorations').asyncDecoBuilderExt;
			//eslint-disable-next-line @typescript-eslint/no-var-requires
			const Prec = require("@codemirror/state").Prec;
			this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
			this.registerEditorExtension(Prec.lowest(textRemovingDecoration(this)));

		}

		const processor = new PostProcessor(this);
		this.registerMarkdownPostProcessor(processor.processor);
	}

	override onunload() {
		this.iconAdder.destruct();
		console.log("disabling plugin: link favicons");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.app.workspace.updateOptions();
	}
}
