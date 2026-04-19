import morph from "@alpinejs/morph";
import Alpine from "alpinejs";
import { initLP } from "./$lp.js";

Alpine.plugin(morph as unknown as Alpine.PluginCallback);

Alpine.plugin((AlpineInstance) => {
	initLP(AlpineInstance);
});

Alpine.start();
