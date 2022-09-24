export function findOpenParen(text: string, closePos: number): number {
	return findMatchingSymbol(text, closePos, "[", "]");
}

export function findMatchingSymbol(text: string, closePos: number, openSymbol: string, closingSymbol: string): number {
	if (!text.includes(openSymbol)) return 0;
	let openPos = closePos;
	let counter = 1;
	while (counter > 0) {
		const c = text[--openPos];
		if (c === undefined) break;
		if (c == openSymbol) {
			counter--;
		} else if (c == closingSymbol) {
			counter++;
		}
	}
	return openPos;
}
