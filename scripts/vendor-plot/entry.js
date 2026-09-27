// Custom Observable Plot build for the Taiga theme: only the entry points the
// chart runtime (assets/js/charts/core.js) and page-bundle widgets call.
// Imported by file path, not via the package index, so the index's side effect
// (Mark.prototype.plot) and every unused mark stay out.
//
// Adding a mark: export it here, add its name to BANNER in build.sh, rebuild,
// and list it in docs/authoring.md#data (the marks a widget may rely on).
export {plot} from "./node_modules/@observablehq/plot/src/plot.js";
export {dot} from "./node_modules/@observablehq/plot/src/marks/dot.js";
export {link} from "./node_modules/@observablehq/plot/src/marks/link.js";
export {arrow} from "./node_modules/@observablehq/plot/src/marks/arrow.js";
export {text} from "./node_modules/@observablehq/plot/src/marks/text.js";
export {rect} from "./node_modules/@observablehq/plot/src/marks/rect.js";
export {ruleX, ruleY} from "./node_modules/@observablehq/plot/src/marks/rule.js";
export {gridY} from "./node_modules/@observablehq/plot/src/marks/axis.js";
