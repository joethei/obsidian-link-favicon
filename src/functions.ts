export function findOpenParen(text: string, closePos: number): number {
	if (!text.includes("[")) return 0;
	let openPos = closePos;
	let counter = 1;
	while (counter > 0) {
		const c = text[--openPos];
		if (c === undefined) break;
		if (c == '[') {
			counter--;
		} else if (c == ']') {
			counter++;
		}
	}
	return openPos;
}
