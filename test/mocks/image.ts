/**
 * jsdom neither decodes images nor draws them on a canvas.
 * This decides like a browser whether an `<img>` with a data url can be displayed:
 * raster formats are sniffed from their bytes, svg needs the `image/svg+xml` type.
 * FastAverageColor returns a fixed gray, override it with `vi.spyOn(FastAverageColor.prototype, "getColorAsync")`.
 */
import {FastAverageColor} from "fast-average-color";

const rasterSignatures = [
	[0x89, 0x50, 0x4e, 0x47], //png
	[0x00, 0x00, 0x01, 0x00], //ico
	[0x47, 0x49, 0x46, 0x38], //gif
	[0xff, 0xd8, 0xff], //jpeg
	[0x52, 0x49, 0x46, 0x46], //webp
];

export function isDecodable(src: string): boolean {
	const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(src);
	//jsdom does not load other urls, assume they work
	if (!match) return src !== "";
	const [, type, base64, data] = match;
	const bytes = base64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));
	if (rasterSignatures.some(signature => signature.every((byte, i) => bytes[i] === byte))) return true;
	return type === "image/svg+xml" && bytes.toString().includes("<svg");
}

const imageProto = HTMLImageElement.prototype;
const size = function (this: HTMLImageElement) {
	return isDecodable(this.getAttribute("src") ?? "") ? 16 : 0;
};
Object.defineProperty(imageProto, "naturalWidth", {configurable: true, get: size});
Object.defineProperty(imageProto, "naturalHeight", {configurable: true, get: size});
Object.defineProperty(imageProto, "complete", {configurable: true, get: () => true});

FastAverageColor.prototype.getColorAsync = function () {
	return Promise.resolve({
		value: [128, 128, 128, 255],
		rgb: "rgb(128,128,128)",
		rgba: "rgba(128,128,128,1)",
		hex: "#808080",
		hexa: "#808080ff",
		isDark: false,
		isLight: true,
	});
};
