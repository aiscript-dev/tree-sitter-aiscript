import { Language, Parser, type Node } from "web-tree-sitter";
import type { InvalidNode, NodeView, NodeView_array_literal, NodeView_comment, NodeView_destructuring, NodeView_expr, NodeView_numeric_literal, NodeView_object_literal, NodeView_object_literal_field,  NodeView_stmt_let, NodeView_stmt_var, NodeView_string_literal, NodeView_type_annotation, UnnamedTypeViews } from "../dist/generated/views.js";
import { expect } from "vitest";
import { fileURLToPath } from "node:url";

export type Path = [string, number | string][];

const chunkN = <T>(n: number, arr: T[]): T[][] => Array.from({ length: ((arr.length + n - 1) / n) >>> 0 }, (_, i) => arr.slice(i * n, i * n + n));

export const toStringPath = (path: Path) => chunkN(3, path.map(([name, i]) => `[${i}] ${name}`)).map(x => x.join(" > ")).join("\n  > ");

export type NodeChecker<N> = (node: Node, path?: Path) => N;

export type MoreChecker<N extends Node, Fields extends Record<string, Node | null>> =
  | {
    extract: (node: N) => Fields;
    checker: { [K in keyof Fields]: null | NodeChecker<Exclude<Fields[K], null>["type"]> }
  }
  | {
    expect: (node: N) => void;
  }
  ;

export type ChildrenChecker<N extends Node> =
  | NodeChecker<Exclude<N["children"][number], InvalidNode>["type"]>[]
  | {
    match: { [K in Exclude<N["children"][number], InvalidNode>["type"]]?: NodeChecker<K> }
  }
  | {
    filter: (node: Node) => boolean;
    children: NodeChecker<Exclude<N["children"][number], InvalidNode>["type"]>[];
  }
  ;

export type NodeViewOf<Type extends NodeView["type"]> = Extract<NodeView, Type extends unknown ? { type: Type } : never>;

export type NodeChildOf<Type extends NodeView["type"]> = Exclude<NodeViewOf<Type>["children"][number], InvalidNode>;

export const isNodeType = <Type extends NodeView["type"]>(type: Type, node: Node): node is NodeViewOf<Type> => node.type == type;

const hasProperty = <T extends {}, N extends string | symbol | number>(o: T, name: N): name is typeof name & keyof T => name in o;

export function _<T>(node: Node): T;
export function _(node: Node) { return node.type; }

export function mustBeNode<Type extends NodeView["type"], const Fields extends Record<string, Node | null> | null>(
  type: Type,
  more: Fields extends {} ? MoreChecker<NodeViewOf<Type>, Fields> : null,
  children?: ChildrenChecker<NodeChildOf<Type>>
): NodeChecker<Type> {
  return (node, path = [[node.type, "root"]]) => {
    expect(node.type, `is node.type == ${JSON.stringify(type)}\n  ${toStringPath(path)}\n  ${node.toString()}\n\n`).toBe(type);

    if (isNodeType(type, node) && more) {
      if ("expect" in more) {
        more.expect(node);
      } else {
        const fields = more.extract(node);
        for (const name in fields) {
          const field = fields[name];

          if (field) {
            more.checker[name]!(field, [...path, [field.type, name]]);
          }
        }
      }
    }

    if (!children) return type;

    if (Array.isArray(children)) {
      expect(node.children.length, `is ${type} children.length == ${children.length}\n  ${toStringPath(path)}\n  ${node.toString()}\n\n`).toBe(children.length);

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]!;

        children[i]!(child, [...path, [child.type, i]]);
      }
    } else if ("filter" in children) {
      const items = node.children.map((x, i) => [i, x] as const).filter(([_, x]) => children.filter(x));

      expect(items.length, `is ${type} children.length == ${children.children.length}\n  ${toStringPath(path)}\n  ${node.toString()}\n\n`).toBe(children.children.length);

      for (let i = 0; i < items.length; i++) {
        const [j, child] = items[i]!;

        children.children[i]!(child, [...path, [child.type, j]]);
      }
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]!;

        if (hasProperty(children.match, child.type)) {
          children.match[child.type]!(child, [...path, [child.type, i]]);
        }
      }
    }

    return type;
  }
}

let aiscript: Language;

async function createParser() {
  const parser = new Parser();

  aiscript ??= await Language.load(fileURLToPath(import.meta.resolve("../tree-sitter-aiscript.wasm")));

  parser.setLanguage(aiscript);

  return parser;
}

export function grammarTestOf<N extends NodeView["type"]>(code: string, checker: NodeChecker<N>) {
  return async () => {
    const parser = await createParser();

    const tree = parser.parse(code);

    expect(tree).not.toBeNullable();

    if (tree) {
      checker(tree.rootNode);
    }
  }
}

export function mustBeIdent(name: string) {
  return mustBeNode("ident", {
    expect: node => {
      expect(node.text).toBe(name)
    }
  });
}

export function mustBeComment(comment: string) {
  return mustBeNode("comment", {
    expect: node => {
      expect(node.text).toBe(comment)
    }
  });
}

function mustBeSingleChildContainer<N extends NodeView["type"]>(name: N) {
  return (checker: NodeChecker<Exclude<Extract<NodeView, { type: N }>["children"][number], InvalidNode>["type"]>) => {
    return mustBeNode(name, null, [checker]);
  }
}

export const mustBeReference = mustBeSingleChildContainer("reference");
export const mustBeExpr = mustBeSingleChildContainer("expr");
export const mustBeStmt = mustBeSingleChildContainer("stmt");
export const mustBeBlockChild = mustBeSingleChildContainer("block_child");
export const mustBeGlobalBlockChild = mustBeSingleChildContainer("global_block_child");
export const mustBeLiteral = mustBeSingleChildContainer("literal");
export const mustBeDestructuring = mustBeSingleChildContainer("destructuring");

export function mustBeParentheses(expr: NodeChecker<"expr">) {
  return mustBeNode("parentheses", null, {
    filter: x => x.isNamed,
    children: [expr]
  });
}

export function mustBeStringLiteral<T extends Exclude<NodeView_string_literal["children"][number], InvalidNode | NodeView_comment>["type"]>(type: `${T}`, raw: string) {
  return mustBeNode("string_literal", null, [
    mustBeNode(type, {
      expect: node => expect(node.text).toBe(raw)
    })
  ]);
}

export function mustBeNumericLiteral<T extends Exclude<NodeView_numeric_literal["children"][number], InvalidNode | NodeView_comment>["type"]>(type: `${T}`, raw: string) {
  return mustBeNode("numeric_literal", null, [
    mustBeNode(type, {
      expect: node => expect(node.text).toBe(raw)
    })
  ]);
}

export function mustBeObjectLiteral<T extends Exclude<NodeView_object_literal["children"][number], InvalidNode | NodeView_comment>["type"]>(children: NodeChecker<T>[]) {
  return mustBeNode("object_literal", null, {
    filter: x => x.isNamed,
    children
  });
}

export function mustBeArrayLiteral<T extends Exclude<NodeView_array_literal["children"][number], InvalidNode | NodeView_comment>["type"]>(children: NodeChecker<T>[]) {
  return mustBeNode("array_literal", null, {
    filter: x => x.isNamed,
    children
  });
}

function extractObjectField(node: NodeView_object_literal_field) {
  const res = {
    key: node.childForFieldName("key"),
    value: node.childForFieldName("value"),
  } as const;

  expect(res).not.toStrictEqual({
    key: null,
    value: null
  });

  return res;
}

export function mustBeObjectLiteralField(key: NodeChecker<"ident">, value: NodeChecker<"expr">) {
  return mustBeNode("object_literal_field", {
    extract: extractObjectField,
    checker: {
      key,
      value,
    }
  });
}

const boolLiterals = [
  mustBeNode("bool_literal", null, [
    mustBeNode("bool_false", null)
  ]),
  mustBeNode("bool_literal", null, [
    mustBeNode("bool_true", null)
  ]),
]

export function mustBeBoolLiteral(value: boolean) {
  return boolLiterals[value ? 1 : 0]!;
}

export const mustBeNullLiteral = mustBeNode("null_literal", null);

export function mustBeBinaryOperator<Op extends UnnamedTypeViews[keyof UnnamedTypeViews]["type"]>(op: Op, left: NodeChecker<"expr">, right: NodeChecker<"expr">) {
  return mustBeNode("binary_operator", {
    extract: x => {
      return {
        left: x.childForFieldName("left"),
        right: x.childForFieldName("right"),
        operator_symbol: x.childForFieldName("operator_symbol"),
      }
    },
    checker: {
      operator_symbol: mustBeNode(op, null),
      left,
      right
    }
  })
}

/**
 * タグ付きテンプレートの改行コードから | までの空白文字を削除し、複数行の文字列とする
 * Zig の複数行文字列リテラルと同等
 *
 * Example:
 * ```ts
 * raw`
 * |a
 * |  b
 * |c
 * `
 * >>> "a\n  b\nc\n"
 * ```
 */
export function raw(tmpl: TemplateStringsArray): string {
  return tmpl.raw.join("").split(/\n[ \t]*\|?/).join("\n");
}


export function mustBeVariableStmt<N extends (NodeView_stmt_let | NodeView_stmt_var)["type"]>(type: N, name: NodeChecker<NodeView_destructuring["type"]>, decl: NodeChecker<NodeView_type_annotation["type"]> | null, initial: NodeChecker<NodeView_expr["type"]>) {
  return mustBeNode(type, {
    extract: node => {
      const res = {
        name: node.childForFieldName("name"),
        type: node.childForFieldName("type"),
        initial: node.childForFieldName("initial"),
      } as const;

      if (decl == null) {
        expect(res.type).toBeNullable();
      } else {
        expect(res.type).not.toBeNullable();
      }

      return res;
    },
    checker: {
      name,
      type: decl,
      initial
    }
  })
}

export function mustBeMatchChildCase(condition: NodeChecker<"expr">, body: NodeChecker<"expr">) {
  return mustBeNode("match_child_case", {
    extract: node => {
      const res = {
        condition: node.childForFieldName("condition"),
        body: node.childForFieldName("body"),
      } as const;

      expect(res.condition).not.toBeNullable();
      expect(res.body).not.toBeNullable();

      return res;
    },
    checker: {
      condition,
      body
    }
  });
}

export function mustBeMatchChildDefault(body: NodeChecker<"expr">) {
  return mustBeNode("match_child_default", {
    extract: node => {
      const res = {
        body: node.childForFieldName("body"),
      } as const;

      expect(res.body).not.toBeNullable();

      return res;
    },
    checker: {
      body
    }
  });
}

export function mustBeEval(body: NodeChecker<"block">) {
  return mustBeNode("expr_eval", {
    extract: node => {
      const res = {
        body: node.childForFieldName("body"),
      } as const;

      expect(res.body).not.toBeNullable();

      return res;
    },
    checker: {
      body
    }
  });
}

export function mustBeBlock(children: NodeChecker<"block_child">[]) {
  return mustBeNode("block", null, {
    filter: x => x.isNamed,
    children
  });
}

