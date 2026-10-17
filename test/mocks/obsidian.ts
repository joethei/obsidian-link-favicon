/**
 * Minimal runtime stand-in for the `obsidian` module, which only ships type definitions.
 * vitest.config.ts aliases `obsidian` to this file.
 * Extend it when code under test needs more of the API.
 */
import {vi} from "vitest";
import {StateField} from "@codemirror/state";

export interface RequestUrlResponse {
	status: number;
	headers: Record<string, string>;
	text: string;
	json: unknown;
	arrayBuffer: ArrayBuffer;
}

/** replace the implementation per test, e.g. `requestUrl.mockResolvedValueOnce(...)` */
export const requestUrl = vi.fn(async (_request: unknown): Promise<RequestUrlResponse> => ({
	status: 200,
	headers: {},
	text: "",
	json: undefined,
	arrayBuffer: new Uint8Array([137, 80, 78, 71]).buffer,
}));

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	return Buffer.from(buffer).toString("base64");
}

/**
 * whether the editor is in live preview (true) or source mode (false).
 * Tests pick the mode with `editorLivePreviewField.init(() => false)`.
 */
export const editorLivePreviewField = StateField.define<boolean>({
	create: () => true,
	update: value => value,
});

export interface Debouncer<T extends unknown[], V> {
	(...args: T): this;
	cancel(): this;
	run(): V | void;
}

export function debounce<T extends unknown[], V>(cb: (...args: T) => V, timeout = 0, resetTimer = false): Debouncer<T, V> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let lastArgs: T | null = null;
	const run = () => {
		timer = null;
		if (lastArgs === null) return;
		const args = lastArgs;
		lastArgs = null;
		return cb(...args);
	};
	const debounced = function (...args: T) {
		lastArgs = args;
		if (timer !== null && resetTimer) {
			clearTimeout(timer);
			timer = null;
		}
		if (timer === null) {
			timer = setTimeout(run, timeout);
		}
		return debounced;
	} as Debouncer<T, V>;
	debounced.cancel = () => {
		if (timer !== null) clearTimeout(timer);
		timer = null;
		lastArgs = null;
		return debounced;
	};
	debounced.run = run;
	return debounced;
}

export class Notice {
	static messages: string[] = [];
	message: string;

	constructor(message: string) {
		this.message = message;
		Notice.messages.push(message);
	}

	hide() {}
}

export class Events {
	on() { return {}; }
	off() {}
	offref() {}
	trigger() {}
}

export class Component {
	load() {}
	onload() {}
	unload() {}
	onunload() {}
	addChild<T>(child: T) { return child; }
	removeChild<T>(child: T) { return child; }
	register(_cb: () => unknown) {}
	registerEvent(_ref: unknown) {}
	registerDomEvent() {}
	registerInterval(id: number) { return id; }
}

export class App {}

export class Plugin extends Component {
	app: unknown;
	manifest: unknown;

	constructor(app?: unknown, manifest?: unknown) {
		super();
		this.app = app;
		this.manifest = manifest;
	}

	loadData = vi.fn(async () => ({}));
	saveData = vi.fn(async (_data: unknown) => undefined);
	addSettingTab() {}
	addCommand() {}
	registerEditorExtension() {}
	registerMarkdownPostProcessor() {}
}

export class PluginSettingTab {
	app: unknown;
	plugin: unknown;
	containerEl: HTMLElement;

	constructor(app: unknown, plugin: unknown) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement("div");
	}

	display() {}
	hide() {}
}

export class Modal {
	app: unknown;
	contentEl: HTMLElement = document.createElement("div");
	titleEl: HTMLElement = document.createElement("div");

	constructor(app: unknown) {
		this.app = app;
	}

	open() {}
	close() {}
	setTitle(title: string) { this.titleEl.textContent = title; return this; }
}

export class Setting {
	settingEl: HTMLElement = document.createElement("div");

	constructor(_containerEl?: HTMLElement) {}

	setName() { return this; }
	setDesc() { return this; }
	setHeading() { return this; }
	setClass() { return this; }
	addText() { return this; }
	addTextArea() { return this; }
	addToggle() { return this; }
	addDropdown() { return this; }
	addButton() { return this; }
	addExtraButton() { return this; }
}

export class SettingGroup {
	constructor(_containerEl?: HTMLElement) {}

	setHeading() { return this; }
	addSetting() { return this; }
}

export class AbstractInputSuggest<T> {
	app: unknown;
	inputEl: HTMLInputElement;

	constructor(app: unknown, inputEl: HTMLInputElement) {
		this.app = app;
		this.inputEl = inputEl;
	}

	getSuggestions(_query: string): T[] | Promise<T[]> { return []; }
	renderSuggestion(_value: T, _el: HTMLElement) {}
	selectSuggestion(_value: T, _evt: MouseEvent | KeyboardEvent) {}
	setValue(value: string) { this.inputEl.value = value; }
	close() {}
}
