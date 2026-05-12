import {MarkdownPostProcessorContext, Notice} from "obsidian";
import {providers} from "./provider";
import FaviconPlugin from "./main";

export class PostProcessor {
	plugin: FaviconPlugin;

	constructor(plugin: FaviconPlugin) {
		this.plugin = plugin;
	}

	processor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
		if (!this.plugin.settings.enableReading) {
			return;
		}

		if (context.sourcePath.contains("no-favicon")) {
			return;
		}

		let provider = providers[this.plugin.settings.provider];
		let fallbackProvider = providers[this.plugin.settings.fallbackProvider];

			//uses providers from frontmatter, if supplied for easier debugging
			if (context.frontmatter) {
				const frontmatter = context.frontmatter as Record<string, unknown>;
				const providerName = frontmatter["favicon-provider"];
				const fallbackProviderName = frontmatter["fallback-favicon-provider"];
				const fmProvider = typeof providerName === "string" ? providers[providerName] : undefined;
				const fmFallbackProvider = typeof fallbackProviderName === "string" ? providers[fallbackProviderName] : undefined;
				if (fmProvider)
					provider = fmProvider;

			if (fmFallbackProvider)
				fallbackProvider = fmFallbackProvider;
		}


		if (!provider || !fallbackProvider) {
			console.error("Link Favicons: misconfigured providers");
			new Notice('Link favicons:misconfigured providers, please check the settings');
			return;
		}

			//delay rendering in Preview, to allow other plugins to finish their stuff(like dataview for issue #13)
			const timeout = 50;
			window.setTimeout(() => {
				void this.processLinks(element, provider, fallbackProvider);
			}, timeout);
		}

		private processLinks = async (element: HTMLElement, provider: typeof providers[string], fallbackProvider: typeof providers[string]): Promise<void> => {
				const links = element.querySelectorAll("a.external-link:not([data-favicon])");
				for (let index = 0; index < links.length; index++) {
					const link = links.item(index) as HTMLAnchorElement;
				link.dataset.disabled = String(this.isDisabled(link));
				if (!this.isDisabled(link)) {
					if (link.textContent?.includes("|nofavicon")) {
						link.href = link.href.replace("%7Cnofavicon", "");
						link.ariaLabel = link.ariaLabel.replace("%7Cnofavicon", "");
						link.textContent = link.textContent.replace("|nofavicon", "");
						continue;
					}


					link.dataset.favicon = "true";

					const icon = await this.plugin.getIcon(link.href, provider);
					const fallbackIcon = await this.plugin.getIcon(link.href, fallbackProvider);

					const url = this.plugin.iconAdder.constructURL(link.href);
					if(!url) return;

					try {
						await this.plugin.iconAdder.addFavicon(link, icon, fallbackIcon, url);
						} catch(e) {
							console.error(e);
						}

					}
				}
		}


	isDisabled = (el: Element) => {
		if (el.getAttribute("data-no-favicon")) return true;
		if (el.getAttribute("data-favicon")) return true;
		if (!this.plugin.settings.showLink && el.textContent === el.getAttribute("href")) return true;
		if (!this.plugin.settings.showAliased && el.textContent !== el.getAttribute("href")) return true;

		return false;
	}
}
