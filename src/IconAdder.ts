import FaviconPlugin from "./main";
import {IconElement} from "./types";
import ls from "localstorage-slim";
import {arrayBufferToBase64, requestUrl} from "obsidian";
import tinycolor from "tinycolor2";
import FastAverageColor from "fast-average-color";

/**
 *
 * @since 1.8
 */
export class IconAdder {

	private fac = new FastAverageColor();
	private readonly plugin: FaviconPlugin;

	constructor(plugin: FaviconPlugin) {
		this.plugin = plugin;
	}

	destruct() {
		this.fac.destroy();
	}

	public constructURL(link: string): URL | undefined {
		try {
			return new URL(link);
		} catch (e) {
			//we have a link without a protocol for some reason
			console.log(link);
			if(!link.startsWith("http")) return this.constructURL("http://" + link);
			return undefined;
		}
	}

	public async addFavicon(el: HTMLElement, icon: IconElement, fallbackIcon: IconElement, url: URL) {
		if ((!icon || icon === "") && (!fallbackIcon || fallbackIcon === "")) {
			console.log("no icon for " + url.href);
			return;
		}

		if (!icon || icon === "") {
			await this.useDownloadedIcon(fallbackIcon, el, url);
			return;
		}

		if (typeof icon === "string") {
			//any unicode symbols
			if (!icon.startsWith("http")) {
				this.addIcon(el, icon);
				return;
			}

			const objEl = await this.getImageEl(icon, url);
			this.addIcon(el, objEl);

			return;
		}

		this.addIcon(el, icon);
	}

	public async getImageEl(icon: string, qualifier: string | URL): Promise<HTMLImageElement> {
		if (typeof qualifier === "string") {
			const url = this.constructURL(qualifier);
			if (!url) return Promise.reject("could not get Object for " + icon + " " + qualifier);
			return this.getImageElFromUrl(icon, url);

		} else {
			return this.getImageElFromUrl(icon, qualifier);
		}
	}

	private async getImageElFromUrl(icon: string, url: URL): Promise<HTMLImageElement> {
		const el = activeDocument.createElement("img");
		el.addClass("link-favicon");

		el.dataset.host = url.hostname;

		el.src = await this.getEncodedIcon(icon, url.hostname);

		await this.setColorAttributes(el);

		//making sure these styles will not be overwritten by any other theme/plugin
		//i.e. page preview sets height: auto, which creates huge icons.
		el.style.height = "0.8em";
		el.style.display = "inline-block";

		return el;
	}


	private async useDownloadedIcon(icon: IconElement, el: HTMLElement, url: URL) {
		if (!icon || icon === "") return;

		if (typeof icon === "string") {
			const imgEl = activeDocument.createElement("img");
			imgEl.addClass("link-favicon");
			imgEl.src = await this.getEncodedIcon(icon, url.hostname);

			await this.setColorAttributes(imgEl);
			this.addIcon(el, imgEl);
		}

	}

	/**
	 * add icon to link element in the page
	 * @param el
	 * @param link
	 * @private
	 */
	private addIcon(el: HTMLElement, link: string | HTMLElement) {
		if (!link || link === "undefined") return;
		if (this.plugin.settings.iconPosition === "front") {
			el.prepend(link);
		}
		if (this.plugin.settings.iconPosition === "back") {
			el.append(link);
		}
	}

	/**
	 * get icon from cache or download.
	 * @param icon web location for the icon
	 * @param hostname hostname for which the icon is.
	 * @returns Icon base64 encoded.
	 * @private
	 */
	private async getEncodedIcon(icon: string, hostname: string): Promise<string> {
		if (icon === "") return "";
		const parts = icon.split(".");
		let extension = parts[parts.length - 1];

		//default to png if there is no extension.
		if (!extension) {
			extension = "png";
		}

		const name = "lf-" + hostname + "." + extension;

		const entry = ls.get<string>(name);
		if (entry) {
			return entry;
		}

		const downloaded = await this.downloadIcon(icon);

		//cache for one month
		ls.set<string>(name, downloaded, {ttl: 30 * 24 * 60 * 60});

		return downloaded;
	}

	/**
	 * Download the icon from the web and encode it
	 * @param iconUrl
	 * @returns Icon base64 encoded
	 * @private
	 */
	private async downloadIcon(iconUrl: string): Promise<string> {
		const request = await requestUrl({url: iconUrl});
		if (request.status !== 200) {
			return Promise.reject("server returned status code" + request.status + " for " + iconUrl);
		}
		return "data:image/png;base64," + arrayBufferToBase64(request.arrayBuffer);
	}

	/**
	 * retrieve color data about icon and add it as CSS attributes.
	 * The CSS will then change the coloring based on these values.
	 * @param img image element
	 * @private
	 */
	private async setColorAttributes(img: HTMLImageElement) {
		const darkEl = activeDocument.getElementsByClassName("theme-dark")[0];
		const lightEl = activeDocument.getElementsByClassName("theme-light")[0];


		let background: string;

		if (darkEl !== undefined) {
			try {
				const style = activeWindow.getComputedStyle(darkEl);
				background = style.getPropertyValue('--background-primary');
			} catch (e) {
				background = "000000";
			}

		} else {
			try {
				const style = activeWindow.getComputedStyle(lightEl);
				background = style.getPropertyValue('--background-primary');
			} catch (e) {
				background = "FFFFFF";
			}
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
		} catch (e) {
			console.error("could not extract color information from icon");
			console.error(img);
			console.error(e);
		}
	}


}
