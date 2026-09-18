import {describe, expect, it} from "vitest";
import {providers} from "../src/provider";
import {createPlugin} from "./helpers";

describe("getIcon", () => {
	it("asks the provider for the hostname of the link", async () => {
		const plugin = createPlugin();

		const icon = await plugin.getIcon("https://obsidian.md/some/page", providers["google"]);

		expect(icon).toBe("https://www.google.com/s2/favicons?domain=obsidian.md");
	});

	it("rejects links that are not urls", async () => {
		const plugin = createPlugin();

		await expect(plugin.getIcon("not a url", providers["google"])).rejects.toThrow("Invalid URL");
	});
});
