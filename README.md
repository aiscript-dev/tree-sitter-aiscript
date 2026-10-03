# tree-sitter-aiscript

<a href="https://github.com/aiscript-dev/tree-sitter-aiscript/actions/workflows/test.yaml">
<img src="https://github.com/aiscript-dev/tree-sitter-aiscript/actions/workflows/test.yaml/badge.svg" />
</a>

<a href="https://github.com/aiscript-dev/tree-sitter-aiscript/actions/workflows/release.yaml">
<img src="https://github.com/aiscript-dev/tree-sitter-aiscript/actions/workflows/release.yaml/badge.svg" />
</a>

- [Releases](https://github.com/aiscript-dev/tree-sitter-aiscript/releases)

  The package tarball contains only the precompiled WASM, it not conains native bindings.

Example(NodeJS):
```ts
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { Parser, Language } from "web-tree-sitter";

const wasmBinaryPath =
  fileURLToPath(
    import.meta.resolve("@aiscript-dev/tree-sitter-aiscript/tree-sitter-aiscript.wasm")
  );

await Parser.init();

const parser =
  await readFile(wasmBinaryPath)
    .then(x => Language.load(x))
    .then(x => new Parser().setLanguage(x));

const tree = parser.parse(`<: "Hello, world!"`);

console.log(tree?.rootNode.toString());
```
