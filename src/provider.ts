import {request} from "obsidian";
import {FaviconPluginSettings} from "./settings";

export default class IconProvider {

	static GOOGLE = new IconProvider("google", "Google", (domain) => {
		return Promise.resolve("https://www.google.com/s2/favicons?domain=" + domain);
	});
	static DUCKDUCKGO = new IconProvider("duckduckgo", "DuckDuckGo", (domain => {
		return Promise.resolve("https://icons.duckduckgo.com/ip3/" + domain + ".ico");
	}));
	static ICONHORSE = new IconProvider("iconhorse", "Icon Horse", (domain => {
		return Promise.resolve("https://icon.horse/icon/" + domain);
	}));
	static SPLITBEE = new IconProvider("splitbee", "SplitBee", (domain => {
		return Promise.resolve("https://favicon.splitbee.io/?url=" + domain);
	}));
	static BESTICON = new IconProvider("besticon", "The Favicon Finder", ((domain, settings) => {
		const host = settings.provider === "besticon" ? settings.providerDomain : settings.fallbackProviderDomain
		return Promise.resolve(host + "/icon?url=" + domain + "&size=32..64..256");
	}));
	static FAVICONGRABBER = new IconProvider("favicongrabber", "Favicon Grabber", (async (domain) => {
		const icons = JSON.parse(await request({
			method: "GET",
			url: "https://favicongrabber.com/api/grab/" + domain
		}));

		if(icons.length === 0) return Promise.resolve("http://invalid.stuff");
		return Promise.resolve(icons.icons[0].src);
	}));

	static providers = Array.of(IconProvider.GOOGLE, IconProvider.DUCKDUCKGO, IconProvider.ICONHORSE, IconProvider.SPLITBEE, IconProvider.BESTICON, IconProvider.FAVICONGRABBER);

	readonly id: string;
	readonly name: string;
	readonly url: (domain: string, settings: FaviconPluginSettings) => Promise<string>;

	constructor(id: string, name: string, url: (domain: string, settings: FaviconPluginSettings) => Promise<string>) {
		this.id = id;
		this.name = name;
		this.url = url;
	}
}
