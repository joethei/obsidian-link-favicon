/**
 * Recreates the DOM and String helpers Obsidian adds to the global prototypes,
 * so plugin code can run under jsdom.
 */
import {afterEach, vi} from "vitest";
import {Notice, requestUrl} from "./mocks/obsidian";
import "./mocks/image";

const nodeProto = Node.prototype as unknown as Record<string, unknown>;
const elementProto = Element.prototype as unknown as Record<string, unknown>;

nodeProto.empty = function (this: Node) {
	while (this.firstChild) this.removeChild(this.firstChild);
};
nodeProto.detach = function (this: Node) {
	this.parentNode?.removeChild(this);
};
nodeProto.instanceOf = function (this: Node, type: new () => unknown) {
	return this instanceof type;
};

elementProto.addClass = function (this: Element, ...classes: string[]) {
	this.classList.add(...classes);
};
elementProto.removeClass = function (this: Element, ...classes: string[]) {
	this.classList.remove(...classes);
};
elementProto.hasClass = function (this: Element, cls: string) {
	return this.classList.contains(cls);
};
elementProto.toggleClass = function (this: Element, cls: string, value: boolean) {
	this.classList.toggle(cls, value);
};
elementProto.setAttr = function (this: Element, name: string, value: string | number | boolean | null) {
	if (value === null) {
		this.removeAttribute(name);
		return;
	}
	this.setAttribute(name, String(value));
};
elementProto.setCssProps = function (this: HTMLElement, props: Record<string, string>) {
	for (const [key, value] of Object.entries(props)) {
		this.style.setProperty(key, value);
	}
};

const stringProto = String.prototype as unknown as Record<string, unknown>;
stringProto.contains = function (this: string, target: string) {
	return this.includes(target);
};

const globals = globalThis as unknown as Record<string, unknown>;
globals.activeDocument = document;
globals.activeWindow = window;

afterEach(() => {
	Notice.messages = [];
	document.body.className = "";
	document.body.empty();
	localStorage.clear();
	requestUrl.mockReset();
	vi.clearAllMocks();
	vi.useRealTimers();
});
