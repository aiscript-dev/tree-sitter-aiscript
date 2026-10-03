# tree-sitter-aiscript とは

`tree-sitter-aiscript` は aiscript の構文を tree-sitter で定義し、ソースコードの解析へ活用できるパーサーを提供することを目標としています。

また、パーサー本体のビルドは WebAsembly をターゲットにしています。

なお、これは aiscript のランタイムが持っているパーサーとは異なる実装であり、一部の構文には対応できていない場合があります。<br/>
そういったケースを見つけた場合、ぜひ issue や Pull Request にておしらせください。

# できること

`tree-sitter-aiscript` は aiscript の言語サーバーで利用するために実装されました。

`tree-sitter` が得意とする増分パースや、不完全な入力の木構造としてのパースなどを aiscript の解析で利用できます。

詳しくは [`tree-sitter` のドキュメント][tree-sitter] を閲覧ください

[tree-sitter]: https://tree-sitter.github.io/

# JavaScript 向けの解析補助

このリポジトリは NPM パッケージとして利用でき、`web-tree-sitter` が持っているツリーの型定義へフィールド名の型補完が効くよう追加の定義を行った型を提供しています。

また、ランタイム時のユーティリティとしてノードタイプが一致するケースにヘルパー型へとキャストできる型ガードを提供しています。

利用するには [`web-tree-sitter`][web-tree-sitter] をプロジェクトにインストールした上で、 <br/>
`tree-sitter-aiscript` を [リリースセクション][releases] からパッケージの tarball をお使いのパッケージマネージャーからインストールしてください。

[web-tree-sitter]: https://www.npmjs.com/package/web-tree-sitter
[releases]: https://github.com/aiscript-dev/tree-sitter-aiscript/releases

## エクスポート一覧

NPM パッケージでは次の要素をエクスポートしています。

| パス                                 | 概要                       | `import(...)`                  | `import.meta.resolve(...)` |
| ------------------------------------ | -------------------------- | ------------------------------ | -------------------------- |
| `@aiscript-dev/tree-sitter-aiscript` | 解析ヘルパー               | ✅️                             | ✅️                         |
| `./views`                            | ノードの型定義             | ✅️                             | ✅️                         |
| `./queries/*`                        | クエリファイル (`*.scm`)   | ⚠️ ( `with { type: "text" }` ) | ✅️                         |
| `./tree-sitter-aiscript.wasm`        | パーサー本体の WebAssembly | ❌️                             | ✅️                         |

## サンプル

```ts
import { Parser, Language } from "web-tree-sitter";

import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const wasmLocation =
  import.meta.resolve(
    "@aiscript-dev/tree-sitter-aiscript/tree-sitter-aiscript.wasm"
  );

const wasmBinaryPath =
  fileURLToPath(wasmLocation);

await Parser.init();

const parser =
  await readFile(wasmBinaryPath)
    .then(x => Language.load(x))
    .then(x => new Parser().setLanguage(x));

const tree = parser.parse(`<: "Hello, world!"`);

console.log(tree?.rootNode.toString());
```

# エディターとの連携

一部のエディターでは `tree-sitter` の構文定義を利用して、ソースコードをハイライトすることができます。

このセクションでは、そのようなエディタ向けの設定の一例を紹介します。

## Helix Editor

```toml
# languages.toml

[[language]]
name = "aiscript"
scope = "source.aiscript"
injection-regex = "^ais(cript)?$"
file-types = [ "ais" ]
indent = { tab-width = 2, unit = "  " }
comment-tokens = [ "//" ]
block-comment-tokens = { start = "/*", end = "*/" }

[[grammar]]
name = "aiscript"
source = { git = "https://github.com/aiscript-dev/tree-sitter-aiscript", rev = "..." }
```
