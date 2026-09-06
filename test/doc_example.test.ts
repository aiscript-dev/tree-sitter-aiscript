import { test, expect } from "vitest";
import { Parser } from "web-tree-sitter";
import {
  grammarTestOf,
  mustBeArrayLiteral,
  mustBeComment,
  mustBeExpr,
  mustBeGlobalBlockChild,
  mustBeIdent,
  mustBeLiteral,
  mustBeNode,
  mustBeNumericLiteral,
  mustBeReference,
  mustBeStmt,
  mustBeStringLiteral,
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
