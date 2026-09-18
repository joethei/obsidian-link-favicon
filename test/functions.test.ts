import {describe, expect, it} from "vitest";
import {findMatchingSymbol} from "../src/functions";

describe("findMatchingSymbol", () => {
	it("returns -1 when the opening symbol is missing", () => {
		expect(findMatchingSymbol("test test", 5, "(", ")")).toBe(-1);
	});

	it("finds the matching opening symbol", () => {
		expect(findMatchingSymbol("test( test)", 11, "(", ")")).toBe(4);
	});
});
