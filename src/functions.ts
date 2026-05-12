export function findOpenParen(text: string, closePos: number): number {
	return findMatchingSymbol(text, closePos, "[", "]");
}

export function findMatchingSymbol(text: string, closePos: number, openSymbol: string, closingSymbol: string): number {
	if (!text.includes(openSymbol)) return -1;
	let openPos = closePos;
	let counter = text[closePos] === closingSymbol ? 1 : 0;
	while (openPos > 0) {
		const c = text[--openPos];
		if (c == openSymbol) {
			counter--;
			if (counter === 0) return openPos;
		} else if (c == closingSymbol) {
			counter++;
		}
	}
	return -1;
}
