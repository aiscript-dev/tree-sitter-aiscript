import { test, expect } from "vitest";
import { Parser } from "web-tree-sitter";
import {
  grammarTestOf,
  mustBeArrayLiteral,
  mustBeBinaryOperator,
  mustBeBlock,
  mustBeBlockChild,
  mustBeComment,
  mustBeDestructuring,
  mustBeEval,
  mustBeExpr,
  mustBeGlobalBlockChild,
  mustBeIdent,
  mustBeLiteral,
  mustBeNode,
  mustBeNumericLiteral,
  mustBeObjectLiteralField,
  mustBeParentheses,
  mustBeReference,
  mustBeStmt,
  mustBeStringLiteral,
  mustBeVariableStmt,
  raw
} from "./dsl.ts";

await Parser.init();

test(`example: mutable variable assignment`, grammarTestOf(
  raw`
  |// ミュータブルな変数を宣言
  |var message = "Hello"
  |
  |// 再代入
  |message = "Hi"
  |
  |// また再代入
  |message = "Yo"
  `,
  mustBeNode("source_file", null, [
    mustBeComment(`// ミュータブルな変数を宣言`),
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_var", {
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
        ),
      ),
      mustBeComment(`// 再代入`),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_assign", {
            extract: node => {
              return {
                target: node.childForFieldName("target"),
                expr: node.childForFieldName("expr"),
                operator_symbol: node.childForFieldName("operator_symbol")
              }
            },
            checker: {
              operator_symbol:
                mustBeNode("symbol_assign", null),
              target:
                mustBeReference(mustBeIdent("message")),
              expr:
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"Hi"`)
                  ])
                )
            }
          })
        ),
      ),
      mustBeComment(`// また再代入`),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_assign", {
            extract: node => {
              return {
                target: node.childForFieldName("target"),
                expr: node.childForFieldName("expr"),
                operator_symbol: node.childForFieldName("operator_symbol")
              }
            },
            checker: {
              operator_symbol:
                mustBeNode("symbol_assign", null),
              target:
                mustBeReference(mustBeIdent("message")),
              expr:
                mustBeExpr(
                  mustBeNode("literal", null, [
                    mustBeStringLiteral("double_quote_string_literal", `"Yo"`)
                  ])
                )
            }
          })
        )
      )
    ])
  ])
));

test(`example: array print "ai", "kawaii"`, grammarTestOf(
  raw`
  |let arr = ["ai", "chan", "kawaii"]
  |<: arr[0] // "ai"
  |<: arr[2] // "kawaii"
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
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
                  mustBeIdent("arr")
                ]),
              initial:
                mustBeExpr(
                  mustBeLiteral(
                    mustBeArrayLiteral([
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeStringLiteral("double_quote_string_literal", `"ai"`)
                        )
                      ),
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeStringLiteral("double_quote_string_literal", `"chan"`)
                        )
                      ),
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeStringLiteral("double_quote_string_literal", `"kawaii"`)
                        )
                      )
                    ])
                  )
                )
            }
          })
        )
      ),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_print", {
            extract: node => {
              return {
                expr: node.childForFieldName("expr"),
              };
            },
            checker: {
              expr:
                mustBeExpr(
                  mustBeReference(
                    mustBeNode("index_accessor", {
                      extract: node => {
                        const res = {
                          index: node.childForFieldName("index"),
                          target: node.childForFieldName("target"),
                        } as const;

                        expect(res.index).not.toBeNullable();
                        expect(res.target).not.toBeNullable();

                        return res;
                      },
                      checker: {
                        target:
                          mustBeReference(
                            mustBeIdent("arr")
                          ),
                        index:
                          mustBeExpr(
                            mustBeLiteral(
                              mustBeNumericLiteral("decimal", "0")
                            )
                          ),
                      }
                    })
                  )
                )
            }
          })
        )
      ),
      mustBeComment(`// "ai"`),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_print", {
            extract: node => {
              return {
                expr: node.childForFieldName("expr"),
              };
            },
            checker: {
              expr:
                mustBeExpr(
                  mustBeReference(
                    mustBeNode("index_accessor", {
                      extract: node => {
                        const res = {
                          index: node.childForFieldName("index"),
                          target: node.childForFieldName("target"),
                        } as const;

                        expect(res.index).not.toBeNullable();
                        expect(res.target).not.toBeNullable();

                        return res;
                      },
                      checker: {
                        target:
                          mustBeReference(
                            mustBeIdent("arr")
                          ),
                        index:
                          mustBeExpr(
                            mustBeLiteral(
                              mustBeNumericLiteral("decimal", "2")
                            )
                          ),
                      }
                    })
                  )
                )
            }
          })
        )
      ),
      mustBeComment(`// "kawaii"`),
    ])
  ])
));

test(`example: eval expression`, grammarTestOf(
  raw`
  |let foo = eval {
  |  let a = 1
  |  let b = 2
  |  (a + b)
  |}
  |
  |<: foo // 3
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeVariableStmt(
            "stmt_let",
            mustBeDestructuring(mustBeIdent("foo")),
            null,
            mustBeExpr(
              mustBeEval(
                mustBeBlock([
                  mustBeBlockChild(
                    mustBeStmt(
                      mustBeVariableStmt(
                        "stmt_let",
                        mustBeDestructuring(mustBeIdent("a")),
                        null,
                        mustBeExpr(
                          mustBeLiteral(
                            mustBeNumericLiteral("decimal", "1")
                          )
                        )
                      )
                    )
                  ),
                  mustBeBlockChild(
                    mustBeStmt(
                      mustBeVariableStmt(
                        "stmt_let",
                        mustBeDestructuring(mustBeIdent("b")),
                        null,
                        mustBeExpr(
                          mustBeLiteral(
                            mustBeNumericLiteral("decimal", "2")
                          )
                        )
                      )
                    )
                  ),
                  mustBeBlockChild(
                    mustBeExpr(
                      mustBeParentheses(
                        mustBeExpr(
                          mustBeBinaryOperator(
                            "+",
                            mustBeExpr(mustBeReference(mustBeIdent("a"))),
                            mustBeExpr(mustBeReference(mustBeIdent("b")))
                          )
                        )
                      )
                    )
                  )
                ])
              )
            )
          )
        )
      ),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_print", {
            extract: node => {
              const res = {
                expr: node.childForFieldName("expr"),
              } as const;

              expect(res.expr).not.toBeNullable();

              return res;
            },
            checker: {
              expr:
                mustBeExpr(
                  mustBeReference(
                    mustBeIdent("foo")
                  )
                )
            }
          })
        )
      ),
      mustBeComment(`// 3`),
    ])
  ])
));

test(`example: if expression`, grammarTestOf(
  raw`
  |if (a == b) {
  |  <: "a equals to b"
  |} elif (a > b) {
  |  <: "a is greater than b"
  |} else {
  |  <: "a is less than b"
  |}
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
        mustBeExpr(
          mustBeNode("expr_if", {
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
              condition:
                mustBeExpr(
                  mustBeParentheses(
                    mustBeExpr(
                      mustBeBinaryOperator(
                        "==",
                        mustBeExpr(mustBeReference(mustBeIdent("a"))),
                        mustBeExpr(mustBeReference(mustBeIdent("b")))
                      )
                    )
                  )
                ),
              body:
                mustBeBlock([
                  mustBeBlockChild(
                    mustBeStmt(
                      mustBeNode("stmt_print", {
                        extract: node => {
                          const res = {
                            expr: node.childForFieldName("expr"),
                          } as const;

                          expect(res.expr).not.toBeNullable();

                          return res;
                        },
                        checker: {
                          expr:
                            mustBeExpr(
                              mustBeLiteral(
                                mustBeStringLiteral("double_quote_string_literal", `"a equals to b"`)
                              )
                            )
                        }
                      })
                    )
                  )
                ])
            }
          }, {
            filter: x => x.type === "expr_elif" || x.type === "expr_else",
            children: [
              mustBeNode("expr_elif", {
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
                  condition:
                    mustBeExpr(
                      mustBeParentheses(
                        mustBeExpr(
                          mustBeBinaryOperator(
                            ">",
                            mustBeExpr(mustBeReference(mustBeIdent("a"))),
                            mustBeExpr(mustBeReference(mustBeIdent("b")))
                          )
                        )
                      )
                    ),
                  body:
                    mustBeBlock([
                      mustBeBlockChild(
                        mustBeStmt(
                          mustBeNode("stmt_print", {
                            extract: node => {
                              const res = {
                                expr: node.childForFieldName("expr"),
                              } as const;

                              expect(res.expr).not.toBeNullable();

                              return res;
                            },
                            checker: {
                              expr:
                                mustBeExpr(
                                  mustBeLiteral(
                                    mustBeStringLiteral("double_quote_string_literal", `"a is greater than b"`)
                                  )
                                )
                            }
                          })
                        )
                      )
                    ])
                }
              }),
              mustBeNode("expr_else", {
                extract: node => {
                  const res = {
                    body: node.childForFieldName("body"),
                  } as const;

                  expect(res.body).not.toBeNullable();

                  return res;
                },
                checker: {
                  body:
                    mustBeBlock([
                      mustBeBlockChild(
                        mustBeStmt(
                          mustBeNode("stmt_print", {
                            extract: node => {
                              const res = {
                                expr: node.childForFieldName("expr"),
                              } as const;

                              expect(res.expr).not.toBeNullable();

                              return res;
                            },
                            checker: {
                              expr:
                                mustBeExpr(
                                  mustBeLiteral(
                                    mustBeStringLiteral("double_quote_string_literal", `"a is less than b"`)
                                  )
                                )
                            }
                          })
                        )
                      )
                    ])
                }
              }),
            ]
          })
        )
      )
    ])
  ])
));

test(`example: template expression`, grammarTestOf(
  [
    `let ai = "kawaii"`,
    `<: \`Hello, {ai} world!\``,
  ].join("\n"),
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeVariableStmt(
            "stmt_let",
            mustBeDestructuring(mustBeIdent("ai")),
            null,
            mustBeExpr(
              mustBeLiteral(
                mustBeStringLiteral("double_quote_string_literal", `"kawaii"`)
              )
            )
          )
        )
      ),
      mustBeGlobalBlockChild(
        mustBeStmt(
          mustBeNode("stmt_print", {
            extract: node => {
              return {
                expr: node.childForFieldName("expr"),
              };
            },
            checker: {
              expr:
                mustBeExpr(
                  mustBeLiteral(
                    mustBeNode("string_literal", null, [
                      mustBeNode("back_quote_string_literal", null, [
                        mustBeNode("symbol_back_quote", null),
                        mustBeNode("back_quote_string_content", null, [
                          mustBeNode("back_quote_string_text", {
                            expect: node => {
                              expect(node.text).toBe("Hello, ");
                            }
                          })
                        ]),
                        mustBeNode("back_quote_string_content", null, [
                          mustBeNode("back_quote_string_expansion", {
                            extract: node => {
                              return {
                                expr: node.childForFieldName("expr")
                              }
                            },
                            checker: {
                              expr:
                                mustBeExpr(
                                  mustBeReference(
                                    mustBeIdent("ai")
                                  )
                                )
                            }
                          }),
                        ]),
                        mustBeNode("back_quote_string_content", null, [
                          mustBeNode("back_quote_string_text", {
                            expect: node => {
                              expect(node.text).toBe(" world!");
                            }
                          })
                        ]),
                        mustBeNode("symbol_back_quote", null),
                      ])
                    ])
                  )
                )
            }
          })
        )
      )
    ])
  ])
));

test(`example: metadata expression`, grammarTestOf(
  raw`
  |### {
  |  name: "example"
  |  version: 42
  |  keywords: ["foo", "bar", "baz"]
  |}
  `,
  mustBeNode("source_file", null, [
    mustBeNode("global", null, [
      mustBeGlobalBlockChild(
        mustBeNode("metadata", {
          extract: node => {
            const res = {
              data: node.childForFieldName("data"),
            } as const;

            expect(res.data).not.toBeNullable();

            return res;
          },
          checker: {
            data:
              mustBeLiteral(
                mustBeNode("object_literal", null, {
                  filter: x => x.isNamed,
                  children: [
                    mustBeObjectLiteralField(
                      mustBeIdent("name"),
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeStringLiteral("double_quote_string_literal", `"example"`)
                        )
                      )
                    ),
                    mustBeObjectLiteralField(
                      mustBeIdent("version"),
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeNumericLiteral("decimal", "42")
                        )
                      )
                    ),
                    mustBeObjectLiteralField(
                      mustBeIdent("keywords"),
                      mustBeExpr(
                        mustBeLiteral(
                          mustBeArrayLiteral([
                            mustBeExpr(
                              mustBeLiteral(
                                mustBeStringLiteral("double_quote_string_literal", `"foo"`)
                              )
                            ),
                            mustBeExpr(
                              mustBeLiteral(
                                mustBeStringLiteral("double_quote_string_literal", `"bar"`)
                              )
                            ),
                            mustBeExpr(
                              mustBeLiteral(
                                mustBeStringLiteral("double_quote_string_literal", `"baz"`)
                              )
                            ),
                          ])
                        )
                      )
                    ),
                  ]
                })
              )
          }
        })
      )
    ])
  ])
));
