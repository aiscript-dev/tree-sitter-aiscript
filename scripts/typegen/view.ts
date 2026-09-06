import type { NodeField, TreeSitterContainerNodeType, TreeSitterNodeType } from "../../lib/node-types.ts";
import { addDifferentIndentLevel, addIndentLevel, emitText, type CodeGeneratorState, type LoadedNodeTypes } from "./common.ts";

export interface ViewGeneratorOptions {
  treeSitterWebModuleName: string;
}

export function* generateAllViews(state: CodeGeneratorState, nodeTypes: LoadedNodeTypes, opts: ViewGeneratorOptions): Generator<string, void> {
  state = yield* emitImports(state, opts);
  state = yield* emitText(state, "\n\n");

  state = yield* emitInvalidNodeType(state);
  state = yield* emitText(state, "\n\n");

  state = yield* emitNodeTypeUnion(state, nodeTypes);
  state = yield* emitText(state, "\n\n");

  state = yield* emitExtraNodeTypeUnion(state, nodeTypes);
  state = yield* emitText(state, "\n\n");

  state = yield* emitAllUnamedTypes(state, nodeTypes);
  state = yield* emitText(state, "\n\n");

  state = yield* emitAllNamedTypes(state, nodeTypes);
  state = yield* emitText(state, "\n\n");
}

function* emitImports(state: CodeGeneratorState, { treeSitterWebModuleName }: ViewGeneratorOptions): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, "import type { Node } from ", JSON.stringify(treeSitterWebModuleName), ";")

  return state;
}

function* emitExtraNodeTypeUnion(state: CodeGeneratorState, { extraTypes, types }: LoadedNodeTypes): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, `type ExtraNode =`);
  state = addIndentLevel(state, 1);

  for (const name of extraTypes) {
    const ty = types.get(name)!;

    state = yield* emitText(state, "\n| ");
    state = yield* emitNodeTypeReference(state, ty);
  }

  state = addIndentLevel(state, -1);
  state = yield* emitText(state, `\n;`);

  return state;
}

function* emitAllUnamedTypes(state: CodeGeneratorState, { unnamedTypes, types }: LoadedNodeTypes): Generator<string, CodeGeneratorState> {
  let i = 0;

  for (const name of unnamedTypes) {
    const ty = types.get(name)!;

    state = yield* emitNodeTypeDocumentComment(state, ty);
    state = yield* emitText(state, "\n");

    state = yield* emitText(state, `interface UnnamedTypeView_${i} extends Node `);

    state = yield* emitNodeTypeExpression(state, ty);

    state = yield* emitText(state, `\n\n`);

    i++;
  }

  state = yield* emitText(state, "export interface UnnamedTypeViews {\n");
  state = addIndentLevel(state, 1);

  i = 0;
  for (const name of unnamedTypes) {
    state = yield* emitText(state, JSON.stringify(name), `: UnnamedTypeView_${i};\n`);

    i++;
  }

  state = addIndentLevel(state, -1);
  state = yield* emitText(state, "}");

  return state;
}

function* emitInvalidNodeType(state: CodeGeneratorState): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, "export type InvalidNode =\n");
  state = addIndentLevel(state, 1);

  state = yield* emitText(state, "& Node\n");

  state = yield* emitText(state, "& (");
  state = addIndentLevel(state, 1);

  state = yield* emitText(state, "\n| { isError: true; }");
  state = yield* emitText(state, "\n| { isMissing: true; }");

  state = addIndentLevel(state, -1);
  state = yield* emitText(state, "\n)");
  state = yield* emitText(state, "\n;");

  state = addIndentLevel(state, -1);

  return state;
}

function* emitAllNamedTypes(state: CodeGeneratorState, { namedTypes, types }: LoadedNodeTypes): Generator<string, CodeGeneratorState> {
  for (let i = 0; i < namedTypes.length; i++) {
    const name = namedTypes[i]!;
    const ty = types.get(name)!;

    if (i > 0) {
      state = yield* emitText(state, "\n\n");
    }

    state = yield* emitNodeTypeDocumentComment(state, ty);
    state = yield* emitText(state, "\n");

    state = yield* emitText(state, `export interface NodeView_${name} extends Node `);
    state = yield* emitNodeTypeExpression(state, ty);
  }

  return state;
}

function* emitNodeTypeUnion(state: CodeGeneratorState, { namedTypes, unnamedTypes, types }: LoadedNodeTypes): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, "export type NodeView =");
  state = addIndentLevel(state, 1);

  if (unnamedTypes.length > 0) {
    state = yield* emitText(state, "\n| UnnamedTypeViews[keyof UnnamedTypeViews]");
    state = yield* emitText(state, "\n| ExtraNode");
  }

  for (const name of namedTypes) {
    const child = types.get(name)!;

    state = yield* emitText(state, "\n| ");
    state = yield* emitNodeTypeReference(state, child);
  }

  state = yield* emitText(state, "\n;");
  state = addIndentLevel(state, -1);

  return state;
}

function* emitNodeTypeReference(state: CodeGeneratorState, ty: TreeSitterNodeType, prefix = ""): Generator<string, CodeGeneratorState> {
  if (ty.named) {
    state = yield* emitText(state, `${prefix}NodeView_` + ty.type);
  } else {
    state = yield* emitText(state, `${prefix}UnnamedTypeViews[`, JSON.stringify(ty.type), "]");
  }

  return state;
}

function* emitNodeTypeExpression(state: CodeGeneratorState, ty: TreeSitterNodeType): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, "{\n");
  state = addIndentLevel(state, 1);

  state = yield* emitText(state, "type: ", JSON.stringify(ty.type));
  state = yield* emitText(state, ";\n");

  if ("fields" in ty && ty.fields) {
    state = yield* emitNodeTypeFields(state, ty);
  }

  if ("children" in ty && ty.children) {
    state = yield* emitNodeTypeChildren(state, ty.children);
    state = yield* emitText(state, ";\n");
  }

  state = addIndentLevel(state, -1);
  state = yield* emitText(state, "}");

  return state;
}

function* emitNodeTypeFields(state: CodeGeneratorState, ty: TreeSitterContainerNodeType): Generator<string, CodeGeneratorState> {
  for (const name in ty.fields) {
    const field = ty.fields[name]!;

    state = yield* emitNodeTypeField(state, name, field);
    state = yield* emitText(state, ";\n");
  }

  return state;
}

function* emitNodeTypeField(state: CodeGeneratorState, name: string, field: NodeField): Generator<string, CodeGeneratorState> {
  if (field.multiple) {
    state = yield* emitText(state, `childrenForFieldName(name: ${JSON.stringify(name)}): `);
  } else {
    state = yield* emitText(state, `childForFieldName(name: ${JSON.stringify(name)}): null | `);
  }

  state = yield* emitText(state, "(");

  state = addIndentLevel(state, 1);

  state = yield* emitText(state, "\n| InvalidNode");

  for (let i = 0; i < field.types.length; i++) {
    const childType = field.types[i]!;

    state = yield* emitText(state, "\n| ");

    state = yield* emitNodeTypeReference(state, childType);
  }

  state = addIndentLevel(state, -1);

  if (field.multiple) {
    state = yield* emitText(state, "\n)[]");
  } else {
    state = yield* emitText(state, "\n)");
  }

  return state;
}

function* emitNodeTypeChildren(state: CodeGeneratorState, field: NodeField): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, `children: `);

  state = yield* emitText(state, "(");

  state = addIndentLevel(state, 1);

  state = yield* emitText(state, "\n| InvalidNode");
  state = yield* emitText(state, "\n| ExtraNode");

  for (let i = 0; i < field.types.length; i++) {
    const childType = field.types[i]!;

    state = yield* emitText(state, "\n| ");

    state = yield* emitNodeTypeReference(state, childType);
  }

  state = addIndentLevel(state, -1);

  state = yield* emitText(state, "\n)[]");

  return state;
}

function* emitNodeTypeDocumentComment(state: CodeGeneratorState, ty: TreeSitterNodeType): Generator<string, CodeGeneratorState> {
  state = yield* emitText(state, "/**\n");

  const prevIndent = state.indent;
  state = addDifferentIndentLevel(state, 1, " * ");

  state = yield* emitText(state, "name: `", ty.type, "`\n");

  if ("fields" in ty && ty.fields) {
    const fields = Object.keys(ty.fields);

    state = yield* emitText(
      state,
      "fields: `", fields.length.toString(), "` ",
      fields.length ? "(" + fields.map(x => "`" + x + "`").join(", ") + ")" : "",
      "\n"
    );
  } else {
    state = yield* emitText(state, "fields: `0`\n");
  }

  if ("children" in ty && ty.children) {
    state = yield* emitText(state, "has_children: `yes`\n");
  } else {
    state = yield* emitText(state, "has_children: `no`\n");
  }

  state = addDifferentIndentLevel(state, -1, prevIndent);
  state = yield* emitText(state, " */");

  return state;
}
