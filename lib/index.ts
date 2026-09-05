import type { Node } from "web-tree-sitter";
import type { NodeView } from "./generated/views.ts";
import names from "./generated/node-type-names.ts";

/**
 * url of `"@aiscript-dev/tree-sitter-aiscript/tree-sitter-aiscript.wasm"`.
 *
 * ----
 *
 * if you using vite, you can bundle binary assets using static asset handling.
 *
 * ```ts
 * import wasmBinaryURL from "@aiscript-dev/tree-sitter-aiscript/tree-sitter-aiscript.wasm?url";
 * import { Language } from "web-tree-sitter";
 *
 * await fetch(wasmBinaryURL)
 *   .then(x => x.bytes())
 *   .then(x => Language.load(x))
 *   ;
 * ```
 *
 * See: https://vite.dev/guide/assets.html#static-asset-handling
 */
export const wasmBinaryURL = import.meta.resolve("../tree-sitter-aiscript.wasm");

let ruleNames: Set<string>;

export const isKnownNodeType = (node: Node): node is NodeView => {
  ruleNames ??= new Set(names);

  return ruleNames.has(node.type);
}
