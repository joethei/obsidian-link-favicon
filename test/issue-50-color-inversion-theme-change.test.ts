import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {FastAverageColor} from "fast-average-color";
import FaviconPlugin from "../src/main";
import {createPlugin, externalLink, renderReading} from "./helpers";

const dark = {className: "theme-dark", background: "#1e1e1e"};
const light = {className: "theme-light", background: "#ffffff"};

function setTheme(theme: typeof dark) {
	document.body.className = theme.className;
	document.body.style.setProperty("--background-primary", theme.background);
}

/** runs onload with enough of `app` for it, returns the `css-change` handler Obsidian would call */
async function loadPlugin(plugin: FaviconPlugin): Promise<() => void> {
	const app = plugin.app as unknown as {
		vault: {adapter?: unknown},
		workspace: {on: ReturnType<typeof vi.fn>, iterateAllLeaves?: unknown},
	};
	app.vault.adapter = {exists: vi.fn(async () => false)};
	//the open note
	app.workspace.iterateAllLeaves = (callback: (leaf: unknown) => void) => callback({view: {containerEl: document.body}});
	await plugin.onload();
	const call = app.workspace.on.mock.calls.find(([name]) => name === "css-change");
	return call![1] as () => void;
}

/** an icon with the given average color, rendered in reading view */
async function renderIcon(plugin: FaviconPlugin, hex: string): Promise<HTMLImageElement> {
	const isDark = hex === "#000000";
	vi.spyOn(FastAverageColor.prototype, "getColorAsync").mockResolvedValue({
		value: isDark ? [0, 0, 0, 255] : [255, 255, 255, 255],
		rgb: "", rgba: "", hex, hexa: hex + "ff", isDark, isLight: !isDark,
	});
	const el = await renderReading(plugin, `<p>${externalLink("https://example.com", "Example")}</p>`);
	return el.querySelector<HTMLImageElement>("img.link-favicon")!;
}

describe("color inversion after a theme change (#50)", () => {
	beforeEach(() => {
		//jsdom doesn't decode images
		Object.defineProperty(HTMLImageElement.prototype, "complete", {configurable: true, get: () => true});
		Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {configurable: true, get: () => 16});
		Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {configurable: true, get: () => 16});
	});

	afterEach(() => {
		const proto = HTMLImageElement.prototype as unknown as Record<string, unknown>;
		delete proto.complete;
		delete proto.naturalWidth;
		delete proto.naturalHeight;
		document.body.removeAttribute("style");
		vi.restoreAllMocks();
	});

	it("invert a dark icon after switching from the light to the dark theme", async () => {
		setTheme(light);
		const plugin = createPlugin();
		const cssChange = await loadPlugin(plugin);
		const img = await renderIcon(plugin, "#000000");
		expect(img.dataset.isReadableAA).toBe("true");

		setTheme(dark);
		cssChange();

		expect(img.dataset.colorInversion).toBe("true");
		expect(img.dataset.isReadableAA).toBe("false");
		expect(img.dataset.isReadableAAA).toBe("false");
		expect(Number(img.dataset.readable)).toBeLessThan(1.5);
	});

	it("stop inverting a dark icon after switching from the dark to the light theme", async () => {
		setTheme(dark);
		const plugin = createPlugin();
		const cssChange = await loadPlugin(plugin);
		const img = await renderIcon(plugin, "#000000");
		expect(img.dataset.isReadableAA).toBe("false");

		setTheme(light);
		cssChange();

		expect(img.dataset.isReadableAA).toBe("true");
		expect(img.dataset.isReadableAAA).toBe("true");
		expect(Number(img.dataset.readable)).toBe(21);
	});

	it("invert a light icon after switching from the dark to the light theme", async () => {
		setTheme(dark);
		const plugin = createPlugin();
		const cssChange = await loadPlugin(plugin);
		const img = await renderIcon(plugin, "#ffffff");
		expect(img.dataset.isReadableAA).toBe("true");

		setTheme(light);
		cssChange();

		expect(img.dataset.isReadableAA).toBe("false");
		expect(img.dataset.averageColorHex).toBe("#ffffff");
	});
});
