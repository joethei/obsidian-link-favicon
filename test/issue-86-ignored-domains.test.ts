import {describe, expect, it, vi} from "vitest";
import {requestUrl} from "./mocks/obsidian";
import {createEditor, createPlugin, externalLink, iconDecorationsOf, renderReading} from "./helpers";
import FaviconPlugin from "../src/main";

const links = [
	externalLink("https://youtube.com/watch", "YouTube"),
	externalLink("https://obsidian.md", "Obsidian"),
	externalLink("https://github.com", "GitHub"),
].join(" ");

const note = "[YouTube](https://youtube.com/watch) [Obsidian](https://obsidian.md) [GitHub](https://github.com)";

/** hostnames of the links in `el` that got a favicon */
function linksWithIcon(el: HTMLElement): string[] {
	return Array.from(el.querySelectorAll("a"))
		.filter(link => link.querySelector("img.link-favicon"))
		.map(link => new URL(link.href).hostname);
}

async function hostsInLivePreview(plugin: FaviconPlugin, doc = note): Promise<string[]> {
	const view = createEditor(plugin, doc);
	return (await iconDecorationsOf(view)).map(deco => deco.qualifier);
}

/** the besticon provider fails, image downloads work */
function failBesticon() {
	requestUrl.mockImplementation(async (request: unknown) => {
		const url = (request as {url: string}).url;
		if (url.includes("allicons.json")) throw new Error("offline");
		return {status: 200, headers: {}, text: "", json: undefined, arrayBuffer: new Uint8Array([137, 80, 78, 71]).buffer};
	});
}

describe("#86 ignored domains", () => {
	it("reading view: only the ignored domain has no favicon", async () => {
		const plugin = createPlugin({settings: {ignored: "youtube.com"}});

		const el = await renderReading(plugin, `<p>${links}</p>`);

		expect(linksWithIcon(el)).toEqual(["obsidian.md", "github.com"]);
	});

	it("live preview: only the ignored domain has no favicon", async () => {
		const plugin = createPlugin({settings: {ignored: "youtube.com"}});

		expect(await hostsInLivePreview(plugin)).toEqual(["obsidian.md", "github.com"]);
	});

	it("an invalid regex in the ignored domains does not hide the other favicons", async () => {
		const plugin = createPlugin({settings: {ignored: "youtube.com\n(\n"}});

		const el = await renderReading(plugin, `<p>${links}</p>`);

		expect(linksWithIcon(el)).toEqual(["obsidian.md", "github.com"]);
		expect(await hostsInLivePreview(plugin)).toEqual(["obsidian.md", "github.com"]);
	});

	it("ignored domains stored as a list are applied", async () => {
		const plugin = createPlugin();
		vi.spyOn(plugin, "loadData").mockResolvedValue({ignored: ["youtube.com", "example.org"]});
		await plugin.loadSettings();
		plugin.settings.debounce = 0;

		const el = await renderReading(plugin, `<p>${links}</p>`);

		expect(plugin.settings.ignored).toBe("youtube.com\nexample.org");
		expect(linksWithIcon(el)).toEqual(["obsidian.md", "github.com"]);
		expect(await hostsInLivePreview(plugin)).toEqual(["obsidian.md", "github.com"]);
	});
});

describe("#39 one failing link does not hide the others", () => {
	it("reading view: a failing fallback provider keeps the icons of the main provider", async () => {
		failBesticon();
		const plugin = createPlugin({settings: {provider: "google", fallbackProvider: "besticon"}});

		const el = await renderReading(plugin, `<p>${links}</p>`);

		expect(linksWithIcon(el)).toEqual(["youtube.com", "obsidian.md", "github.com"]);
	});

	it("live preview: a failing fallback provider keeps the icons of the main provider", async () => {
		failBesticon();
		const plugin = createPlugin({settings: {provider: "google", fallbackProvider: "besticon"}});

		expect(await hostsInLivePreview(plugin)).toEqual(["youtube.com", "obsidian.md", "github.com"]);
	});

	it("live preview: a link that is not a valid url does not hide the others", async () => {
		const plugin = createPlugin();

		expect(await hostsInLivePreview(plugin, "[bad](http://example.com:99999) " + note)).toEqual(["youtube.com", "obsidian.md", "github.com"]);
	});
});
