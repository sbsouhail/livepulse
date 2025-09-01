import { randomBytes } from "node:crypto";

/**
 * Extract component data (remove duplicated logic)
 */
export function extractData(
	instance: Record<string, unknown>,
): Record<string, unknown> {
	const data: Record<string, unknown> = {};
	for (const key of Object.keys(instance)) {
		const value = instance[key];
		if (typeof value !== "function" && key !== "ctx" && key !== "lpId") {
			data[key] = value;
		}
	}
	return data;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
	return randomBytes(16).toString("hex");
}

/**
 * Get component name from class
 */
export function getComponentName(constructorFn: { name: string }): string {
	return constructorFn.name.toLowerCase();
}

/**
 * Add LivePulse attributes to HTML (optimized without JSDOM)
 */
export function addLpAttributes(
	html: string,
	lpId: string,
	data: Record<string, unknown>,
	componentName: string,
	alreadyRendered: boolean,
): string {
	const snapshot = {
		data,
		name: componentName,
		id: lpId,
	};
	const attrs = `lp:id="${lpId}" ${alreadyRendered ? "" : `lp:snapshot="${btoa(JSON.stringify(snapshot))}"`}`;

	// Simple regex to add attributes to first tag
	return html.replace(/^(\s*<[^>]+)/, `$1 ${attrs}`);
}

/**
 * Component cache for performance
 */
const cache = new Map<string, { default: new () => unknown }>();

export async function importComponent(
	name: string,
): Promise<{ default: new () => unknown }> {
	const cached = cache.get(name);
	if (cached) {
		return cached;
	}

	const { default: ComponentClass } = await import(
		`../../../../../../../app/controllers/livepulse/${name.toLowerCase()}.js`
	);
	cache.set(name, ComponentClass);
	return ComponentClass;
}
