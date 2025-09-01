import type { Edge } from "edge.js";

/**
 * LivePulse Types
 */
export interface LivePulsePayload {
	action: string;
	args: unknown[];
	snapshot: {
		id: string;
		name: string;
		data?: Record<string, unknown>;
	};
}

export interface LivePulseResponse {
	html?: string;
	data?: Record<string, unknown>;
	success: boolean;
}

declare module "@adonisjs/core/http" {
	interface HttpContext {
		/**
		 * Reference to the edge renderer to render templates
		 * during an HTTP request
		 */
		view: ReturnType<Edge["createRenderer"]>;
	}
}
