import {describe, expect, it} from "vitest";
import {createEditor, createPlugin, iconDecorationsOf} from "./helpers";

//bare links need the gfm parser, Obsidian's parser links them as well
describe("issue #69: raw links in parentheses in live preview", () => {
	it("adds icons to all raw links from the issue at the link", async () => {
		const plugin = createPlugin();
		const doc = [
			"- (https://obsidian.md",
			"- (https://obsidian.md)",
			"- https://obsidian.md)",
			"- https://obsidian.md",
		].join("\n");
		const view = createEditor(plugin, doc, {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([
			{from: 3, qualifier: "obsidian.md"},
			{from: 26, qualifier: "obsidian.md"},
			{from: 49, qualifier: "obsidian.md"},
			{from: 72, qualifier: "obsidian.md"},
		]);
	});

	it("adds the icon at the link, not before the checkbox of a task", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "- [ ] (https://github.com)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 7, qualifier: "github.com"}]);
	});

	it("adds the icon at the link, not before a markdown link on the same line", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "[a](https://obsidian.md) (https://github.com)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([
			{from: 0, qualifier: "obsidian.md"},
			{from: 26, qualifier: "github.com"},
		]);
	});

	it("adds the icon after the link when the icon position is back", async () => {
		const plugin = createPlugin({settings: {iconPosition: "back"}});
		const view = createEditor(plugin, "(https://obsidian.md)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 20, qualifier: "obsidian.md"}]);
	});

	it("treats a raw link in parentheses as a raw link, not as an aliased one", async () => {
		const plugin = createPlugin({settings: {showAliased: false}});
		const view = createEditor(plugin, "(https://obsidian.md)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 1, qualifier: "obsidian.md"}]);
	});

	it("adds no icon to a raw link in parentheses when raw links are disabled", async () => {
		const plugin = createPlugin({settings: {showLink: false}});
		const view = createEditor(plugin, "(https://obsidian.md) [a](https://github.com)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 22, qualifier: "github.com"}]);
	});
});
