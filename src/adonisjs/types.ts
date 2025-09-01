/**
 * LivePulse Types
 */
export interface LivePulsePayload {
	action: string;
	args: unknown[];
	snapshot: {
		id: string;
		data?: Record<string, unknown>;
	};
}

export interface LivePulseResponse {
	html?: string;
	data?: Record<string, unknown>;
	success: boolean;
}
