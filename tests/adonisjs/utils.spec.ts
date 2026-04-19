import { test } from "@japa/runner";
import {
	addLpAttributes,
	extractData,
	generateId,
	getComponentName,
} from "../../src/adonisjs/utils.js";

test.group("extractData", () => {
	test("includes public properties", ({ assert }) => {
		const instance = { count: 5, name: "test" } as Record<string, unknown>;
		assert.deepEqual(extractData(instance), { count: 5, name: "test" });
	});

	test("excludes ctx and lpId", ({ assert }) => {
		const instance = {
			count: 1,
			ctx: { request: {} },
			lpId: "abc",
		} as Record<string, unknown>;
		assert.deepEqual(extractData(instance), { count: 1 });
	});

	test("excludes functions", ({ assert }) => {
		const instance = {
			count: 1,
			increment: () => {},
		} as Record<string, unknown>;
		assert.deepEqual(extractData(instance), { count: 1 });
	});

	test("handles nested objects", ({ assert }) => {
		const instance = {
			user: { name: "Alice", age: 30 },
			active: true,
		} as Record<string, unknown>;
		assert.deepEqual(extractData(instance), {
			user: { name: "Alice", age: 30 },
			active: true,
		});
	});

	test("returns empty object when no serializable props", ({ assert }) => {
		const instance = { ctx: {}, fn: () => {} } as Record<string, unknown>;
		assert.deepEqual(extractData(instance), {});
	});
});

test.group("generateId", () => {
	test("returns a 32-char hex string", ({ assert }) => {
		const id = generateId();
		assert.match(id, /^[a-f0-9]{32}$/);
	});

	test("returns unique values", ({ assert }) => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId()));
		assert.equal(ids.size, 100);
	});
});

test.group("getComponentName", () => {
	test("lowercases the name", ({ assert }) => {
		assert.equal(getComponentName({ name: "Counter" }), "counter");
	});

	test("lowercases multi-word name", ({ assert }) => {
		assert.equal(getComponentName({ name: "TodoList" }), "todolist");
	});

	test("lowercases already lowercase name", ({ assert }) => {
		assert.equal(getComponentName({ name: "counter" }), "counter");
	});
});

test.group("addLpAttributes", () => {
	test("injects lp:id attribute", ({ assert }) => {
		const result = addLpAttributes("<div>hello</div>", "id-1", {}, "counter", false);
		assert.include(result, 'lp:id="id-1"');
	});

	test("injects lp:snapshot when not already rendered", ({ assert }) => {
		const result = addLpAttributes("<div>hello</div>", "id-1", {}, "counter", false);
		assert.include(result, "lp:snapshot=");
	});

	test("omits lp:snapshot when already rendered", ({ assert }) => {
		const result = addLpAttributes("<div>hello</div>", "id-1", {}, "counter", true);
		assert.notInclude(result, "lp:snapshot=");
		assert.include(result, 'lp:id="id-1"');
	});

	test("snapshot contains data, name, and id", ({ assert }) => {
		const data = { count: 5 };
		const result = addLpAttributes("<div></div>", "id-1", data, "counter", false);
		const match = result.match(/lp:snapshot="([^"]+)"/);
		assert.isNotNull(match);
		const decoded = JSON.parse(atob(match![1]));
		assert.deepEqual(decoded.data, data);
		assert.equal(decoded.name, "counter");
		assert.equal(decoded.id, "id-1");
	});

	test("does not break existing attributes", ({ assert }) => {
		const html = '<div class="foo" id="bar">content</div>';
		const result = addLpAttributes(html, "lp-1", {}, "comp", false);
		assert.include(result, 'class="foo"');
		assert.include(result, 'id="bar"');
		assert.include(result, ">content</div>");
	});

	test("preserves nested HTML", ({ assert }) => {
		const html = "<div><span>nested</span></div>";
		const result = addLpAttributes(html, "lp-1", {}, "comp", false);
		assert.include(result, "<span>nested</span>");
	});
});
