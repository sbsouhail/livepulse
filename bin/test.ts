import { assert } from "@japa/assert";
import { configure, processCLIArgs, run } from "@japa/runner";
import { specReporter } from "@japa/spec-reporter";

processCLIArgs(process.argv.splice(2));

configure({
	files: ["tests/**/*.spec.ts"],
	plugins: [assert()],
	reporters: { activated: ["spec"] },
	reporter: [specReporter()],
});

run();
