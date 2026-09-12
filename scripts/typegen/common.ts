import { nodeTypes } from "../../lib/node-types.ts";
import type { TreeSitterNodeType } from "../../lib/node-types.ts";

export interface LoadedNodeTypes {
  namedTypes: string[];
  unnamedTypes: string[];
  extraTypes: string[];
  types: Map<string, TreeSitterNodeType>;
}

export function loadNodeTypes(): LoadedNodeTypes | Error[] {
  const errors: Error[] = [];
  const types = new Map<string, TreeSitterNodeType>();
  const namedTypes: string[] = [];
  const unnamedTypes: string[] = [];
  const extraTypes: string[] = [];

  for (const item of nodeTypes) {
    if (types.has(item.type)) {
      errors.push(new Error(`duplicated item type: ${item.type}`));
    } else {
      types.set(item.type, item);

      if (item.named) {
        namedTypes.push(item.type);
      } else {
        unnamedTypes.push(item.type);
      }

      if ("extra" in item && item.extra) {
        extraTypes.push(item.type);
      }
    }
  }

  if (errors.length > 0) return errors;

  return {
    namedTypes,
    unnamedTypes,
    extraTypes,
    types
  };
}

export async function getNodeTypesCheckSum(): Promise<string> {
  const hashed = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(nodeTypes)));

  return "SHA-256: " + [...new Uint8Array(hashed)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export interface CodeGeneratorState {
  indent: string;
  currentIndentLevel: number;
  currentIndent: string;
  isNewLine: boolean;
}

export function* emitText(state: CodeGeneratorState, ...chunks: string[]): Generator<string, CodeGeneratorState> {
  for (const chunk of chunks) {
    const segments = chunk.split(/(\r\n|[\r\n])/);

    for (const data of segments) {
      if (data.length <= 0) continue;

      if (data === "\r\n" || "\r\n".includes(data)) {
        yield data;

        state.isNewLine = true;
      } else {
        if (state.isNewLine) {
          yield `${state.currentIndent}${data}`;
        } else {
          yield `${data}`;
        }

        state.isNewLine = false;
      }
    }
  }

  return state;
}

export function addIndentLevel(state: CodeGeneratorState, n: number): CodeGeneratorState {
  state.currentIndentLevel += n;

  if (n > 0) {
    state.currentIndent += state.indent.repeat(n);
  } else {
    state.currentIndent = state.indent.repeat(state.currentIndentLevel);
  }

  return state;
}


export function addDifferentIndentLevel(state: CodeGeneratorState, n: number, ident: string): CodeGeneratorState {
  state.currentIndentLevel += n;
  state.indent = ident;

  if (n > 0) {
    state.currentIndent += state.indent.repeat(n);
  } else {
    state.currentIndent = state.indent.repeat(state.currentIndentLevel);
  }

  return state;
}

