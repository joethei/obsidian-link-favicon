import {describe, expect, it} from "vitest";
import {createEditor, createPlugin, iconDecorationsOf} from "./helpers";

describe("issue #88: image embeds in live preview", () => {
	it("adds no icon to an image embed", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "![alt](https://obsidian.md/images/banner.png)");

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("adds no icon to an image embed without alt text", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "![](https://obsidian.md/images/banner.png)");

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("adds no icon to an image embed with the icon at the back", async () => {
		const plugin = createPlugin({settings: {iconPosition: "back"}});
		const view = createEditor(plugin, "![alt](https://obsidian.md/images/banner.png)");

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("adds no icon to an image embed in source mode", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "![alt](https://obsidian.md/images/banner.png)", {livePreview: false});

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("still adds an icon to a link next to an image embed", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "![alt](https://obsidian.md/images/banner.png) [link](https://obsidian.md)");

		expect(await iconDecorationsOf(view)).toEqual([{from: 46, qualifier: "obsidian.md"}]);
	});

	it("still adds an icon to a link after an exclamation mark", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "wow! [link](https://obsidian.md)");

		expect(await iconDecorationsOf(view)).toEqual([{from: 5, qualifier: "obsidian.md"}]);
	});
});
