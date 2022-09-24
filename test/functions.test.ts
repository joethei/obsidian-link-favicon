import {findMatchingSymbol} from "../src/functions";

test('find matching symbol', () => {
	expect(findMatchingSymbol("test test", 5, "(", ")")).toBe(-1);
	expect(findMatchingSymbol("test( test)", 11, "(", ")")).toBe(4);
});
