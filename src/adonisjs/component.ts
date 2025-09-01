import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
	addLpAttributes,
	extractData,
	generateId,
	getComponentName,
} from "./utils.js";

/**
 * LivePulse Component Base Class
 */
@inject()
export default abstract class LivePulseComponent {
	private lpId?: string;

	constructor(public ctx: HttpContext) {}

	/**
	 * Set LivePulse ID (for state preservation)
	 */
	public setLpId(id: string): void {
		this.lpId = id;
	}

	/**
	 * Main handler - renders component with LivePulse attributes
	 */
	public async handle(ctx?: HttpContext): Promise<string> {
		if (ctx) this.ctx = ctx;

		await this.init();
		const data = extractData(this as Record<string, unknown>);

		// Share data with view
		const viewData: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data)) {
			viewData[`$${key}`] = value;
		}
		// Note: view.share might not be available in all contexts
		this.ctx.view.share(viewData);

		const html = await this.render(this.ctx);

		const alreadyRendered = !!this.lpId;

		// Generate ID if needed
		if (!this.lpId) {
			this.lpId = generateId();
		}

		return addLpAttributes(
			html,
			this.lpId,
			data,
			getComponentName(this.constructor),
			alreadyRendered,
		);
	}

	/**
	 * Child components implement these
	 */
	abstract render(ctx: HttpContext): Promise<string>;
	abstract init(): Promise<void>;
}
