import type { Alpine } from "alpinejs";
import { applyMorph } from "./lp_morph.js";
import { callBackend } from "./lp_request.js";

const proxies = new Map<string, Record<string, unknown>>();

export function initLP(AlpineInstance: Alpine) {
	AlpineInstance.magic("lp", (el: Element) => {
		const id = el.closest("[lp\\:id]")?.getAttribute("lp:id");
		return id && proxies.has(id) ? proxies.get(id) : {};
	});

	document.querySelectorAll("[lp\\:id]").forEach((el) => {
		const id = el.getAttribute("lp:id");
		if (id && !proxies.has(id)) {
			const data = el.getAttribute("lp:snapshot");
			proxies.set(
				id,
				createProxy(el, data ? parseSnapshot(data, id) : {}, AlpineInstance),
			);
			el.removeAttribute("lp:snapshot");
		}
	});
}

function parseSnapshot(snapshot: string, id: string) {
	try {
		const parsed = JSON.parse(atob(snapshot));
		// If the snapshot already has a data structure, use it as is
		if (parsed.data && typeof parsed.data === "object") {
			return {
				data: parsed.data,
				...Object.fromEntries(
					Object.entries(parsed).filter(([key]) => key !== "data"),
				),
				id,
			};
		}
		// Otherwise, extract lp_meta and wrap user data
		const { lp_meta, ...userData } = parsed;
		return {
			data: userData,
			...lp_meta,
			id,
		};
	} catch (e) {
		console.error("Invalid lp:snapshot:", e);
		return { data: {}, id };
	}
}

function createProxy(
	el: Element,
	data: Record<string, unknown>,
	AlpineInstance: Alpine,
) {
	const reactiveData = AlpineInstance.reactive(data);

	return new Proxy(reactiveData, {
		get(target: { data: Record<string, unknown> }, property) {
			const prop = property.toString();

			if (prop.includes(".")) {
				return prop
					.split(".")
					.reduce<unknown>(
						(obj, key) =>
							obj && typeof obj === "object" && obj !== null && key in obj
								? (obj as Record<string, unknown>)[key]
								: undefined,
						target,
					);
			}

			if (prop in target.data) return target.data[prop];

			// Backend method call
			return async (...args: unknown[]) => {
				// Filter out event objects
				const filteredArgs = args.filter((arg) => !(arg instanceof Event));
				console.log(`Calling backend action: ${prop}`, filteredArgs);
				// Create snapshot with both user data and metadata
				const snapshot = {
					data: target.data,
					...Object.fromEntries(
						Object.entries(target).filter(([key]) => key !== "data"),
					),
				};
				const result = await callBackend(snapshot, prop, filteredArgs);
				if (result) {
					if (result.html) applyMorph(el, result.html, AlpineInstance);
					if (result.data)
						Object.assign(target.data as Record<string, unknown>, result.data);
				}
			};
		},

		set(target: { data: Record<string, unknown> }, property, value) {
			const prop = property.toString();

			if (prop.includes(".")) {
				const keys = prop.split(".");
				let obj: Record<string, unknown> = target.data;

				for (let i = 0; i < keys.length - 1; i++) {
					const key = keys[i];
					if (!(key && key in obj)) {
						console.error(
							`Cannot set value. Path "${keys
								.slice(0, i + 1)
								.join(".")}" does not exist.`,
						);
						return false;
					}
					obj = obj[key] as Record<string, unknown>;
				}

				const lastKey = keys[keys.length - 1];
				if (!(lastKey && lastKey in obj)) {
					console.error(
						`Cannot set value. Property "${lastKey}" does not exist.`,
					);
					return false;
				}

				obj[lastKey] = value;
				return true;
			}

			// Set properties in target.data instead of target
			if (prop in target.data) {
				target.data[prop] = value;
				return true;
			}

			// Allow setting new properties in data
			target.data[prop] = value;
			return true;
		},
	});
}
