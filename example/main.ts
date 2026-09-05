import { Parser, Language, Node } from "web-tree-sitter";
import { isKnownNodeType } from "../lib/index.ts";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

async function main() {
  await Parser.init();

  const parser = new Parser();
  const aiscript = await Language.load(fileURLToPath(import.meta.resolve("../tree-sitter-aiscript.wasm")));

  parser.setLanguage(aiscript);

  const code = await readFile(fileURLToPath(import.meta.resolve("./main.ais")), "utf-8");

  const tree = parser.parse(code);
  if (tree === null) return;

  const node = tree.rootNode;
  if (!isKnownNodeType(node)) {
    console.log(tree?.rootNode.toString());
    return;
  }

  function dump(node: Node): object {
    return {
      type: node.type,
      isNamed: node.isNamed,
      isExtra: node.isExtra,
      isError: node.isError,
      isMissing: node.isMissing,
      hasChanges: node.hasChanges,
      hasError: node.hasError,
      children: node.children.map(dump)
    }
  }

  console.log(JSON.stringify(dump(node), null, "  "));
};

await main();
