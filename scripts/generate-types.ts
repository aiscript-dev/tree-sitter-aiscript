//
// tree-sitter が生成する `node-types.json` から TypeScript の型としての CST を生成するツール
//

import { open, mkdir } from "node:fs/promises";
import { type CodeGeneratorState,loadNodeTypes } from "./typegen/common.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAllViews } from "./typegen/view.ts";
import { generateNodeTypeNames } from "./typegen/node-type-names.ts";

const createInitialCodeGeneratorState = (): CodeGeneratorState => ({
  indent: "  ",
  currentIndentLevel: 0,
  currentIndent: "",
  isNewLine: true
});

async function generateBy<A extends unknown[]>(outFile: string, fn: (s: CodeGeneratorState, ...args: A) => Generator<string, void>, ...args: A): Promise<number> {
  await using f = await open(outFile, "w+");

  let writedBytes = 0;

  for (const chunk of fn(createInitialCodeGeneratorState(), ...args)) {
    const { bytesWritten } = await f.write(chunk);

    writedBytes += bytesWritten;
  }

  return writedBytes;
}

async function main() {
  const loaded = loadNodeTypes();

  if (Array.isArray(loaded)) {
    console.log(loaded);
    return;
  }

  const rootDir = path.dirname(fileURLToPath(import.meta.resolve("../package.json")));
  const outDir = path.join(rootDir, "lib/generated");

  const viewsModuleName = "./views.ts";
  const nodeTypeNamesModuleName = "./node-type-names.ts";

  await mkdir(outDir, { recursive: true });

  const entries: [string, ((_: string) => Promise<number>)][] = [
    [viewsModuleName, outFile => generateBy(outFile, generateAllViews, loaded, { treeSitterWebModuleName: "web-tree-sitter" })],
    [nodeTypeNamesModuleName, outFile => generateBy(outFile, generateNodeTypeNames)],
  ];

  const { stdout } = process;

  for (const [outFileName, generate] of entries) {
    const outFilePath = path.join(outDir, outFileName);
    const displayFileName = path.relative(rootDir, outFilePath);

    stdout.write(`generate ${displayFileName} ... `);

    const written = await generate(outFilePath);

    stdout.write(`${(written / 1024).toFixed(1)} KiB (Finish)\r\n`)
  }
}

await main();
