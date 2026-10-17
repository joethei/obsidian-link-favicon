import {describe, expect, it} from "vitest";
import ls from "localstorage-slim";
import {requestUrl} from "obsidian";
import {createEditor, createPlugin, externalLink, renderReading} from "./helpers";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"></svg>').buffer;
const html = new TextEncoder().encode("<!DOCTYPE html><html><body>not found</body></html>").buffer;

const mainIcon = "https://icons.duckduckgo.com/ip3/example.com.ico";
const fallbackIcon = "https://www.google.com/s2/favicons?domain=example.com";

type Response = {arrayBuffer: ArrayBuffer, contentType?: string};

/** answers icon downloads by url, like the providers would */
function serve(responses: Record<string, Response>) {
	const mock = requestUrl as unknown as {mockImplementation: (fn: (request: {url: string}) => unknown) => void};
	mock.mockImplementation(async (request: {url: string}) => {
		const response = responses[request.url];
		if (!response) throw new Error("request failed, status 404");
		return {
			status: 200,
			headers: response.contentType ? {"content-type": response.contentType} : {},
			text: "",
			json: undefined,
			arrayBuffer: response.arrayBuffer,
		};
	});
}

function requestedUrls(): string[] {
	return (requestUrl as unknown as {mock: {calls: [{url: string}][]}}).mock.calls.map(call => call[0].url);
}

async function iconOf(settings = {}) {
	const plugin = createPlugin({settings: {provider: "duckduckgo", fallbackProvider: "google", ...settings}});
	const el = await renderReading(plugin, `<p>${externalLink("https://example.com/page", "Example")}</p>`);
	return el.querySelector<HTMLImageElement>("a img.link-favicon");
}

const pngDataUrl = "data:image/png;base64," + Buffer.from(png).toString("base64");

describe("broken icons (#49)", () => {
	it("use the fallback provider when the main provider returns something that is not an image", async () => {
		serve({
			[mainIcon]: {arrayBuffer: html, contentType: "text/html; charset=UTF-8"},
			[fallbackIcon]: {arrayBuffer: png, contentType: "image/png"},
		});

		const img = await iconOf();

		expect(img).not.toBeNull();
		expect(img!.getAttribute("src")).toBe(pngDataUrl);
	});

	it("show no icon when neither provider returns an image", async () => {
		serve({
			[mainIcon]: {arrayBuffer: html, contentType: "text/html"},
			[fallbackIcon]: {arrayBuffer: html, contentType: "text/html"},
		});

		const img = await iconOf();

		expect(img).toBeNull();
	});

	it("do not cache an icon that is not an image", async () => {
		serve({
			[mainIcon]: {arrayBuffer: html, contentType: "text/html"},
			[fallbackIcon]: {arrayBuffer: png, contentType: "image/png"},
		});

		await iconOf();

		expect(localStorage.getItem("lf-example.com.ico")).toBeNull();
	});

	it("keep the type of an svg icon, so it can be displayed", async () => {
		serve({
			[mainIcon]: {arrayBuffer: svg, contentType: "image/svg+xml"},
			[fallbackIcon]: {arrayBuffer: png, contentType: "image/png"},
		});

		const img = await iconOf();

		expect(img!.getAttribute("src")).toMatch(/^data:image\/svg\+xml;base64,/);
		expect(requestedUrls()).not.toContain(fallbackIcon);
	});

	it("replace a broken icon that is already cached", async () => {
		ls.set("lf-example.com.ico", "data:image/png;base64," + Buffer.from(html).toString("base64"), {ttl: 60});
		serve({
			[mainIcon]: {arrayBuffer: png, contentType: "image/png"},
		});

		const img = await iconOf();

		expect(img!.getAttribute("src")).toBe(pngDataUrl);
		expect(ls.get("lf-example.com.ico")).toBe(pngDataUrl);
	});

	it("use the fallback provider in live preview when the main provider returns something that is not an image", async () => {
		serve({
			[mainIcon]: {arrayBuffer: html, contentType: "text/html"},
			[fallbackIcon]: {arrayBuffer: png, contentType: "image/png"},
		});
		const plugin = createPlugin({settings: {provider: "duckduckgo", fallbackProvider: "google"}});

		const view = createEditor(plugin, "a [link](https://example.com/page) here");
		await new Promise(resolve => setTimeout(resolve, 50));

		const img = view.dom.querySelector<HTMLImageElement>("img.link-favicon");
		expect(img).not.toBeNull();
		expect(img!.getAttribute("src")).toBe(pngDataUrl);
	});
});
