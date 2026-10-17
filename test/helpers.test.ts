import {describe, expect, it} from "vitest";
import {createEditor, createPlugin, externalLink, iconDecorationsOf, renderReading} from "./helpers";

describe("test helpers", () => {
	it("add a favicon to an external link in reading view", async () => {
		const plugin = createPlugin();

		const el = await renderReading(plugin, `<p>${externalLink("https://obsidian.md", "Obsidian")}</p>`);

		const link = el.querySelector("a")!;
		expect(link.dataset.favicon).toBe("true");
		expect(link.querySelector("img.link-favicon")).not.toBeNull();
	});

	it("add an icon decoration for a link in live preview", async () => {
		const plugin = createPlugin();
		const view = createEditor(plugin, "a [link](https://obsidian.md) here");

		const decorations = await iconDecorationsOf(view);

		expect(decorations).toEqual([{from: 2, qualifier: "obsidian.md"}]);
	});
});
