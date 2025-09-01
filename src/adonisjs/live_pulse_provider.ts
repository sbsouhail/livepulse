import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import type { ApplicationService } from "@adonisjs/core/types";
import edge from "edge.js";
import type { TagContract } from "edge.js/types";
import type { LivePulsePayload, LivePulseResponse } from "./types.js";
import { extractData, importComponent } from "./utils.js";

/**
 * LivePulse Provider for AdonisJS
 */
export default class LivePulseProvider {
	constructor(protected app: ApplicationService) {}

	register() {}
	async boot() {}
	async ready() {}
	async shutdown() {}

	async start() {
		this.registerUpdateRoute();
		this.registerEdgeHelper();
		this.registerEdgeTag();
	}

	/**
	 * Register update route
	 */
	private registerUpdateRoute() {
		router.post("/lp/update", async (ctx: HttpContext) => {
			const { request, response } = ctx;

			try {
				const payload = this.validatePayload(request.all());
				const instance = await this.createInstance(payload, ctx);

				await this.callMethod(instance, payload.action, payload.args);
				const result = await this.renderResponse(instance);

				return response.json(result);
			} catch (error) {
				return this.handleError(response, error);
			}
		});
	}

	/**
	 * Register Edge helper
	 */
	private registerEdgeHelper() {
		edge.global(
			"lp",
			(name: string) => async (state: { request: { ctx: HttpContext } }) => {
				try {
					const ctx = state.request.ctx;
					const ComponentClass = await importComponent(name);
					const instance = new (ComponentClass as any)(ctx);
					return await instance.handle(ctx);
				} catch (error) {
					console.error(`[LivePulse] Component '${name}' failed:`, error);
					return `<!-- Component '${name}' failed -->`;
				}
			},
		);
	}

	/**
	 * Register Edge tag
	 */
	private registerEdgeTag() {
		const lp: TagContract = {
			block: false,
			seekable: true,
			tagName: "lp",
			compile(parser, buffer, token) {
				const expression = parser.utils.transformAst(
					parser.utils.generateAST(
						token.properties.jsArg,
						token.loc,
						token.filename,
					),
					token.filename,
					parser,
				);

				buffer.writeExpression(
					`${buffer.outputVariableName} += await state.lp("${expression.value}")(state)`,
					token.filename,
					token.loc.start.line,
				);
			},
		};

		edge.registerTag(lp);
	}

	/**
	 * Validate payload
	 */
	private validatePayload(payload: Record<string, unknown>): LivePulsePayload {
		const { action, args = [], snapshot } = payload;

		if (!action || typeof action !== "string") {
			throw new Error("Missing action");
		}

		return {
			action: action as string,
			args: args as unknown[],
			snapshot: snapshot as { id: string; data?: Record<string, unknown> },
		};
	}

	/**
	 * Create component instance
	 */
	private async createInstance(payload: LivePulsePayload, ctx: HttpContext) {
		const snapshot = payload.snapshot;
		if (!snapshot?.id) {
			throw new Error("Missing snapshot ID");
		}

		const ComponentClass = await importComponent(snapshot.id);
		const instance = new (ComponentClass as any)(ctx);

		if (snapshot.data) {
			Object.assign(instance, snapshot.data);
		}

		return instance;
	}

	/**
	 * Call method safely
	 */
	private async callMethod(
		instance: Record<string, unknown>,
		action: string,
		args: unknown[],
	) {
		if (typeof instance[action] !== "function") {
			throw new Error(`Action ${action} not found`);
		}
		if (action.startsWith("_")) {
			throw new Error(`Action ${action} is private`);
		}
		await (instance[action] as (...args: unknown[]) => Promise<unknown>)(
			...args,
		);
	}

	/**
	 * Render response
	 */
	private async renderResponse(
		instance: Record<string, unknown>,
	): Promise<LivePulseResponse> {
		const data = extractData(instance);
		const html = await (instance.handle as () => Promise<string>)();

		return { html, data, success: true };
	}

	/**
	 * Handle errors
	 */
	private handleError(
		response: {
			status: (code: number) => { json: (data: unknown) => unknown };
		},
		error: unknown,
	) {
		const isDev = process.env.NODE_ENV === "development";
		return response.status(500).json({
			error: "Component update failed",
			message: isDev ? (error as Error).message : "Internal server error",
		});
	}
}
