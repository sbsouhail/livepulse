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
		const data = JSON.parse(atob(snapshot));
		return { ...data, lp_meta: { ...data.lp_meta, id } };
	} catch (e) {
		console.error("Invalid lp:snapshot:", e);
		return {};
	}
}

function createProxy(
	el: Element,
	data: Record<string, unknown>,
	AlpineInstance: Alpine,
) {
	const reactiveData = AlpineInstance.reactive(data);

	return new Proxy(reactiveData, {
		get(target, property) {
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

			if (prop in target) return target[prop];

			// Backend method call
			return async (...args: unknown[]) => {
				console.log(`Calling backend action: ${prop}`, args);
				const result = await callBackend(target, prop, args);
				if (result) {
					if (result.html) applyMorph(el, result.html, AlpineInstance);
					if (result.data) Object.assign(target, result.data);
				}
			};
		},

		set(target, property, value) {
			const prop = property.toString();

			if (prop.includes(".")) {
				const keys = prop.split(".");
				let obj: Record<string, unknown> = target;

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

			if (!(prop in target)) {
				console.error(`Cannot set value. Property "${prop}" does not exist.`);
				return false;
			}

			target[prop] = value;
			return true;
		},
	});
}
