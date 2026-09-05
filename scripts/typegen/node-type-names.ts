import { nodeTypes } from "../../lib/node-types.ts";
import { addIndentLevel, emitText, type CodeGeneratorState } from "./common.ts";

export function* generateNodeTypeNames(state: CodeGeneratorState): Generator<string, void> {
  state = yield* emitText(state, "export default [");
  state = addIndentLevel(state, 1);

  let i = 0;

  for (const nodeType of nodeTypes) {
    if (i > 0) {
      state = yield* emitText(state, ",\n");
    } else {
      state = yield* emitText(state, "\n");
    }

    state = yield* emitText(state, JSON.stringify(nodeType.type));

    i++;
  }

  state = addIndentLevel(state, -1);
  state = yield* emitText(state, "\n] as const;");
}


