import {requestUrl} from "obsidian";
import {FaviconPluginSettings} from "./settings";

export interface IconProvider {
	name: string;
	url: (domain: string, settings: FaviconPluginSettings) => Promise<string>;
}

export const providers: Record<string, IconProvider> = {
	'google': {name: 'Google', url: domain => Promise.resolve("https://www.google.com/s2/favicons?domain=" + domain)},
	'duckduckgo': {name: 'DuckDuckGo', url: domain => Promise.resolve("https://icons.duckduckgo.com/ip3/" + domain + ".ico")},
	'iconhorse': {name: 'Icon Horse', url: domain => Promise.resolve("https://icon.horse/icon/" + domain)},
	'splitbee': {name: 'Splitbee', url: domain => Promise.resolve("https://favicon.splitbee.io/?url=" + domain)},
	'besticon': {name: 'The Favicon Finder', url: async (domain, settings) => {
		const host = settings.provider === "besticon" ? settings.providerDomain : settings.fallbackProviderDomain;
		const result = await requestUrl({url: host + "/allicons.json?url=" + domain});
		if(result.json.icons.length === 0) return Promise.resolve("http://invalid.stuff");
		return Promise.resolve(result.json.icons[0].url);
	}},
	'favicongrabber': {name: 'Favicon Grabber', url: (async (domain) => {
			const result = await requestUrl({url: "https://favicongrabber.com/api/grab/" + domain});
			if(result.json.length === 0) return Promise.resolve("http://invalid.stuff");
			return Promise.resolve(result.json.icons[0].src);
		})},
}
