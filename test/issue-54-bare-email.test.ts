import {describe, expect, it} from "vitest";
import {createEditor, createPlugin, iconDecorationsOf} from "./helpers";

//bare emails need the gfm parser, Obsidian's parser links them as well
describe("issue #54: bare emails in live preview", () => {
	it("adds a mailto icon to a bare email", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "name@example.org", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 0, qualifier: "mailto:"}]);
	});

	it("adds a mailto icon to a bare email inside text", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "mail me at name@example.org please", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 11, qualifier: "mailto:"}]);
	});

	it("adds a mailto icon to an email autolink", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "<name@example.org>", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 1, qualifier: "mailto:"}]);
	});

	it("adds the icon after the email when the icon position is back", async () => {
		const plugin = createPlugin({settings: {iconPosition: "back"}});
		const view = createEditor(plugin, "name@example.org", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 16, qualifier: "mailto:"}]);
	});

	it("adds no icon to a bare email when raw links are disabled", async () => {
		const plugin = createPlugin({settings: {showLink: false}});
		const view = createEditor(plugin, "name@example.org", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("adds no icon to an email as link target, Obsidian treats it as an internal link", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "[alias](name@example.org)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([]);
	});

	it("still adds a mailto icon to an aliased mailto link", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "[mail](mailto:name@example.org)", {gfm: true});

		expect(await iconDecorationsOf(view)).toEqual([{from: 0, qualifier: "mailto:"}]);
	});
});
