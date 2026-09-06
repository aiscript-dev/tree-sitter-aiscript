import { test, expect } from "vitest";
import { Parser } from "web-tree-sitter";
import {
  grammarTestOf,
  mustBeBinaryOperator,
  mustBeBoolLiteral,
  mustBeExpr,
  mustBeIdent,
  mustBeNode,
  mustBeNumericLiteral,
  mustBeObjectLiteralField,
  mustBeReference,
  mustBeStmt,
  mustBeStringLiteral,
  raw
} from "./dsl.ts";

await Parser.init();

test(`print("Hello, world!")`, grammarTestOf(
  raw`
  |print("Hello, world!")
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("call", {
            extract: x => {
              return {
                target: x.childForFieldName("target"),
                params: x.childForFieldName("params"),
              }
            },
            checker: {
              target:
                mustBeReference(mustBeIdent("print")),
              params:
                mustBeNode("call_params", null, {
                  match: {
                    expr:
                      mustBeExpr(
                        mustBeNode("literal", null, [
                          mustBeStringLiteral("double_quote_string_literal", `"Hello, world!"`)
                        ])
                      )
                  }
                })
            }
          })
        )
      ])
    ])
  ])
));

test(`<: "Hello, world!"`, grammarTestOf(
  raw`
  |<: "Hello, world!"
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeNode("stmt", null, [
          mustBeNode("stmt_print", {
            extract: x => {
              return {
                expr: x.childForFieldName("expr"),
              }
            },
            checker: {
              expr:
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"Hello, world!"`)
                  ])
                )
            }
          })
        ])
      ])
    ])
  ])
));

test(`a * b + c / d - e * f`, grammarTestOf(
  raw`
  |a * b + c / d - e * f
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeBinaryOperator("-",
            mustBeExpr(
              mustBeBinaryOperator("+",
                mustBeExpr(
                  mustBeBinaryOperator("*",
                    mustBeExpr(
                      mustBeReference(mustBeIdent("a")),
                    ),
                    mustBeExpr(
                      mustBeReference(mustBeIdent("b")),
                    ),
                  ),
                ),
                mustBeExpr(
                  mustBeBinaryOperator("/",
                    mustBeExpr(
                      mustBeReference(mustBeIdent("c")),
                    ),
                    mustBeExpr(
                      mustBeReference(mustBeIdent("d")),
                    ),
                  )
                ),
              ),
            ),
            mustBeExpr(
              mustBeBinaryOperator("*",
                mustBeExpr(
                  mustBeReference(mustBeIdent("e")),
                ),
                mustBeExpr(
                  mustBeReference(mustBeIdent("f")),
                ),
              ),
            )
          )
        )
      ])
    ])
  ])
));

test(`// comment`, grammarTestOf(
  raw`
  |// comment
  `,
  mustBeNode("source_file", null, [
    mustBeNode("comment", {
      expect: node => {
        expect(node.text).toBe(`// comment`)
      }
    })
  ])
));

test(`/* comment */`, grammarTestOf(
  raw`
  |/*
  |  comment
  |*/
  `,
  mustBeNode("source_file", null, [
    mustBeNode("comment", {
      expect: node => {
        expect(node.text).toBe(`/*\n  comment\n*/`)
      }
    })
  ])
));

test(`"kawaii"`, grammarTestOf(
  raw`
  |"kawaii"
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeStringLiteral("double_quote_string_literal", `"kawaii"`)
          ])
        )
      ])
    ])
  ])
));

test(`'kawaii'`, grammarTestOf(
  raw`
  |'kawaii'
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeStringLiteral("single_quote_string_literal", `'kawaii'`)
          ])
        )
      ])
    ])
  ])
));

test(`1234`, grammarTestOf(
  raw`
  |1234
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNumericLiteral("decimal", "1234")
          ])
        )
      ])
    ])
  ])
));

test(`1234.5678`, grammarTestOf(
  raw`
  |1234.5678
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNumericLiteral("decimal", "1234.5678")
          ])
        )
      ])
    ])
  ])
));

test(`0x1234ABCDEF`, grammarTestOf(
  raw`
  |0x1234ABCDEF
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNumericLiteral("hex_decimal", "0x1234ABCDEF")
          ])
        )
      ])
    ])
  ])
));

test(`true`, grammarTestOf(
  raw`
  |true
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeBoolLiteral(true)
          ])
        )
      ])
    ])
  ])
));

test(`false`, grammarTestOf(
  raw`
  |false
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeBoolLiteral(false)
          ])
        )
      ])
    ])
  ])
));

test(`[ "ai", "chan", "cute" ]`, grammarTestOf(
  raw`
  |[ "ai", "chan", "cute" ]
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNode("array_literal", null, {
              filter: node => node.isNamed,
              children: [
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"ai"`)
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"chan"`)
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"cute"`)
                  ])
                )
              ]
            })
          ])
        )
      ])
    ])
  ])
));

test(`[ "ai" "chan" "cute" ]`, grammarTestOf(
  raw`
  |[ "ai" "chan" "cute" ]
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNode("array_literal", null, {
              filter: node => node.isNamed,
              children: [
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"ai"`)
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"chan"`)
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"cute"`)
                  ])
                )
              ]
            })
          ])
        )
      ])
    ])
  ])
));

test(`[ "hoge", 1234, true ]`, grammarTestOf(
  raw`
  |[ "hoge", 1234, true ]
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNode("array_literal", null, {
              filter: node => node.isNamed,
              children: [
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"hoge"`)
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeNumericLiteral("decimal", "1234")
                  ])
                ),
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeBoolLiteral(true)
                  ])
                )
              ]
            })
          ])
        )
      ])
    ])
  ])
));

test(`{ foo: "bar", a: 42 }`, grammarTestOf(
  raw`
  |{ foo: "bar", a: 42 }
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNode("object_literal", null, {
              filter: node => node.isNamed,
              children: [
                mustBeObjectLiteralField(
                  mustBeIdent("foo"),
                  mustBeExpr(
                    mustBeNode("literal", null, [
                      mustBeStringLiteral("double_quote_string_literal", `"bar"`)
                    ])
                  )
                ),
                mustBeObjectLiteralField(
                  mustBeIdent("a"),
                  mustBeExpr(
                    mustBeNode("literal", null, [
                      mustBeNumericLiteral("decimal", "42")
                    ])
                  )
                )
              ]
            })
          ])
        )
      ])
    ])
  ])
));

test(`null`, grammarTestOf(
  raw`
  |null
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("literal", null, [
            mustBeNode("null_literal", null)
          ])
        )
      ])
    ])
  ])
));

test(`@(x) { x }`, grammarTestOf(
  raw`
  |@(x) { x }
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeExpr(
          mustBeNode("expr_function", {
            extract: node => {
              const res = {
                body: node.childForFieldName("body"),
                params: node.childForFieldName("params")
              } as const;

              expect(node.childForFieldName("return_type")).toBeNullable();

              return res;
            },
            checker: {
              params:
                mustBeNode("function_params", null, {
                  filter: node => node.isNamed,
                  children: [
                    mustBeNode("function_params_field", {
                      extract: node => {
                        const res = {
                          name: node.childForFieldName("name"),
                        } as const;

                        expect(node.childForFieldName("type")).toBeNullable();

                        return res;
                      },
                      checker: {
                        name:
                          mustBeIdent("x")
                      }
                    })
                  ]
                }),
              body: mustBeNode("block", null, {
                filter: node => node.isNamed,
                children: [
                  mustBeNode("block_child", null, [
                    mustBeExpr(
                      mustBeReference(mustBeIdent("x"))
                    )
                  ])
                ]
              })
            }
          })
        )
      ])
    ])
  ])
));

test(`let message = "Hello"`, grammarTestOf(
  raw`
  |let message = "Hello"
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeNode("global_block_child", null, [
        mustBeStmt(
          mustBeNode("stmt_let", {
            extract: node => {
              const res = {
                name: node.childForFieldName("name"),
                initial: node.childForFieldName("initial")
              } as const;

              expect(node.childForFieldName("type")).toBeNullable();

              return res;
            },
            checker: {
              name:
                mustBeNode("destructuring", null, [
                  mustBeIdent("message")
                ]),
              initial:
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"Hello"`)
                  ])
                )
            }
          })
        )
      ])
    ])
  ])
));
