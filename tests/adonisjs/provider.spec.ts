import { test } from "@japa/runner";

function validatePayload(payload: Record<string, unknown>) {
	const { action, args = [], snapshot: rawSnapshot } = payload;

	if (!action || typeof action !== "string") {
		throw new Error("Missing action");
	}
	if (!rawSnapshot || typeof rawSnapshot !== "string") {
		throw new Error("Missing or invalid snapshot");
	}

	let snapshot: Record<string, unknown>;
	try {
		snapshot = JSON.parse(
			Buffer.from(rawSnapshot as string, "base64").toString("utf8"),
		) as Record<string, unknown>;
	} catch {
		throw new Error("Invalid snapshot encoding");
	}

	if (!snapshot.id) throw new Error("Missing snapshot ID");
	if (!snapshot.name) throw new Error("Missing component name");

	return { action, args, snapshot };
}

function encodeSnapshot(obj: unknown): string {
	return Buffer.from(JSON.stringify(obj)).toString("base64");
}

const validSnapshot = encodeSnapshot({
	id: "hex-id",
	name: "counter",
	data: { count: 0 },
});

test.group("validatePayload", () => {
	test("accepts valid payload", ({ assert }) => {
		const result = validatePayload({
			action: "increment",
			args: [],
			snapshot: validSnapshot,
		});
		assert.equal(result.action, "increment");
		assert.equal(result.snapshot.name, "counter");
		assert.equal(result.snapshot.id, "hex-id");
	});

	test("throws on missing action", ({ assert }) => {
		assert.throws(
			() => validatePayload({ snapshot: validSnapshot }),
			"Missing action",
		);
	});

	test("throws on non-string action", ({ assert }) => {
		assert.throws(
			() => validatePayload({ action: 42, snapshot: validSnapshot }),
			"Missing action",
		);
	});

	test("throws on missing snapshot", ({ assert }) => {
		assert.throws(
			() => validatePayload({ action: "inc" }),
			"Missing or invalid snapshot",
		);
	});

	test("throws on non-string snapshot (object)", ({ assert }) => {
		assert.throws(
			() => validatePayload({ action: "inc", snapshot: { id: "x" } }),
			"Missing or invalid snapshot",
		);
	});

	test("throws on invalid base64", ({ assert }) => {
		assert.throws(
			() => validatePayload({ action: "inc", snapshot: "!!!invalid!!!" }),
			"Invalid snapshot encoding",
		);
	});

	test("throws when snapshot missing id", ({ assert }) => {
		const snap = encodeSnapshot({ name: "counter", data: {} });
		assert.throws(
			() => validatePayload({ action: "inc", snapshot: snap }),
			"Missing snapshot ID",
		);
	});

	test("throws when snapshot missing name", ({ assert }) => {
		const snap = encodeSnapshot({ id: "abc", data: {} });
		assert.throws(
			() => validatePayload({ action: "inc", snapshot: snap }),
			"Missing component name",
		);
	});

	test("defaults args to empty array", ({ assert }) => {
		const result = validatePayload({ action: "reset", snapshot: validSnapshot });
		assert.deepEqual(result.args, []);
	});

	test("preserves args", ({ assert }) => {
		const result = validatePayload({
			action: "setCount",
			args: [42],
			snapshot: validSnapshot,
		});
		assert.deepEqual(result.args, [42]);
	});
});

test.group("callMethod security", () => {
	function callMethod(
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
		return (instance[action] as (...a: unknown[]) => unknown)(...args);
	}

	test("calls existing public method", ({ assert }) => {
		const instance = {
			increment: (n: unknown) => Number(n) + 1,
		} as Record<string, unknown>;
		assert.equal(callMethod(instance, "increment", [5]), 6);
	});

	test("throws on missing method", ({ assert }) => {
		assert.throws(
			() => callMethod({} as Record<string, unknown>, "missing", []),
			"Action missing not found",
		);
	});

	test("blocks methods prefixed with _", ({ assert }) => {
		const instance = { _secret: () => "leak" } as Record<string, unknown>;
		assert.throws(
			() => callMethod(instance, "_secret", []),
			"Action _secret is private",
		);
	});
});
