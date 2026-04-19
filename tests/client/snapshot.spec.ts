import { test } from "@japa/runner";
import { parseSnapshot } from "../../src/client/$lp.js";

function encode(obj: unknown): string {
	return btoa(JSON.stringify(obj));
}

test.group("parseSnapshot", () => {
	test("decodes valid snapshot with data wrapper", ({ assert }) => {
		const input = encode({ data: { count: 3 }, id: "abc", name: "counter" });
		const result = parseSnapshot(input, "abc");
		assert.deepEqual(result.data, { count: 3 });
	});

	test("preserves id from snapshot", ({ assert }) => {
		const input = encode({ data: {}, id: "snap-id", name: "counter" });
		const result = parseSnapshot(input, "arg-id");
		assert.equal(result.id, "snap-id");
	});

	test("falls back to passed id when snapshot has none", ({ assert }) => {
		const input = encode({ data: { count: 1 }, name: "counter" });
		const result = parseSnapshot(input, "fallback-id");
		assert.equal(result.id, "fallback-id");
	});

	test("handles legacy lp_meta format", ({ assert }) => {
		const input = encode({
			count: 5,
			name: "counter",
			lp_meta: { id: "legacy-id" },
		});
		const result = parseSnapshot(input, "arg-id");
		assert.equal((result.data as Record<string, unknown>).count, 5);
	});

	test("returns safe defaults on invalid base64", ({ assert }) => {
		const original = console.error;
		console.error = () => {};
		const result = parseSnapshot("not-valid-base64!!!", "fallback");
		console.error = original;
		assert.equal(result.id, "fallback");
		assert.deepEqual(result.data, {});
	});

	test("returns safe defaults on valid base64 but invalid JSON", ({ assert }) => {
		const original = console.error;
		console.error = () => {};
		const result = parseSnapshot(btoa("not json"), "fallback");
		console.error = original;
		assert.equal(result.id, "fallback");
		assert.deepEqual(result.data, {});
	});

	test("handles empty data object", ({ assert }) => {
		const input = encode({ data: {}, id: "x", name: "comp" });
		const result = parseSnapshot(input, "x");
		assert.deepEqual(result.data, {});
	});

	test("preserves name field", ({ assert }) => {
		const input = encode({ data: {}, id: "x", name: "mycounter" });
		const result = parseSnapshot(input, "x");
		assert.equal(result.name, "mycounter");
	});
});
