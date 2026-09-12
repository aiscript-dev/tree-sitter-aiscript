/**
 * @file Aiscript grammar for tree-sitter
 * @license MIT
 */

/**
 * @param {RuleOrLiteral} sym 
 * @param {RuleOrLiteral} left 
 * @param {RuleOrLiteral} right 
 */
function makeBinaryOperator(sym, left, right) {
  return seq(
    field("left", left),
    field("operator_symbol", sym),
    field("right", right)
  );
}

/**
 * @param {RuleOrLiteral} center 
 * @param {RuleOrLiteral} left 
 * @param {RuleOrLiteral} right 
 */
function optionalBetween(center, left, right) {
  return choice(
    seq(
      left, center, right
    ),
    center
  );
}

export default grammar({
  name: "aiscript",
  extras: $ => [
    /\s/,
    /\\(\r\n|[\r\n])/,
    $.comment,
  ],
  word: $ => $.ident,
  precedences: $ => [
    [$.index_accessor, $.expr],
    [$.reference, $.namespace_accessor],
    [$.call_params, $.parentheses],
    [$.expr_else, $.expr],
    [$.call, $.expr]
  ],
  conflicts: $ => [
    [$.block, $.object_literal],
  ],
  rules: {
    source_file: $ => optional($.global),
    comment: _ =>
      token(choice(
        seq("//", /.*/),
        seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
      )),
    global: $ => seq(
      $.global_block_child,
      repeat(seq(
        $._block_delimiter,
        $.global_block_child,
      )),
      optional($._block_delimiter),
    ),
    block: $ => seq(
      "{",
      optional($._block_delimiter),
      optional(seq(
        $.block_child,
        repeat(seq(
          $._block_delimiter,
          $.block_child,
        )),
      )),
      optional($._block_delimiter),
      "}"
    ),
    global_block_child: $ => choice(
      $.namespace,
      $.metadata,
      $.stmt,
      $.expr
    ),
    block_child: $ => choice(
      $.stmt,
      $.expr
    ),
    namespace: $ => seq(
      "::", field("name", $.ident), field("body", $.block)
    ),
    metadata: $ => seq(
      "###", field("data", $.literal)
    ),
    _block_delimiter: $ => choice(
      ";",
      $._linebreak
    ),
    stmt: $ => choice(
      $.stmt_let,
      $.stmt_var,
      $.stmt_function,
      $.stmt_return,
      $.stmt_break,
      $.stmt_continue,
      $.stmt_for_let,
      $.stmt_for,
      $.stmt_each,
      $.stmt_loop,
      $.stmt_while,
      $.stmt_do_while,
      $.stmt_assign,
      $.stmt_print,
    ),
    stmt_let: $ => seq(
      $.keyword_let,
      field("name", $.destructuring),
      field("type", optional($.type_annotation)),
      $.symbol_assign,
      field("initial", $.expr)
    ),
    stmt_var: $ => seq(
      $.keyword_var,
      field("name", $.destructuring),
      field("type", optional($.type_annotation)),
      $.symbol_assign,
      field("initial", $.expr)
    ),
    stmt_function: $ => seq(
      "@",
      field("name", $.ident),
      field("params", $.function_params),
      field("return_type", optional($.type_annotation)),
      field("body", $.block),
    ),
    stmt_return: $ => seq(
      $.keyword_return, field("expr", $.expr)
    ),
    stmt_break: $ => $.keyword_break,
    stmt_continue: $ => $.keyword_continue,
    stmt_for_let: $ => seq(
      $.keyword_for,
      optionalBetween(
        seq(
          $.keyword_let,
          field("name", $.ident),
          ",",
          field("count", $.expr)
        ),
        "(",
        ")",
      ),
      field("body", $.block)
    ),
    stmt_for: $ => seq(
      $.keyword_for,
      field("count", $.expr),
      field("body", $.block)
    ),
    stmt_each: $ => seq(
      $.keyword_each,
      optionalBetween(
        seq(
          $.keyword_let,
          field("name", $.ident),
          ",",
          field("values", $.expr)
        ),
        "(",
        ")",
      ),
      field("body", $.block)
    ),
    stmt_loop: $ => seq(
      $.keyword_loop,
      field("body", $.block)
    ),
    stmt_while: $ => seq(
      $.keyword_while,
      field("cond", $.expr),
      field("body", $.block)
    ),
    stmt_do_while: $ => seq(
      $.keyword_do,
      field("body", $.block),
      $.keyword_while,
      field("cond", $.expr),
    ),
    stmt_assign: $ => prec.right(seq(
      field("target", $.reference),
      field("operator_symbol", choice(
        $.symbol_assign,
        $.symbol_assign_add,
        $.symbol_assign_sub,
      )),
      field("expr", $.expr),
    )),
    stmt_print: $ => seq(
      $.symbol_print,
      field("expr", $.expr),
    ),
    expr: $ => choice(
      $.unary_operator,
      $.binary_operator,
      $.expr_if,
      $.parentheses,
      $.expr_function,
      $.expr_eval,
      $.expr_match,
      $.call,
      $.reference,
      $.literal,
    ),
    unary_operator: $ => choice(
      prec.right(8, seq("-", $.expr)),
    ),
    binary_operator: $ => choice(
      prec.right(7, makeBinaryOperator("^", $.expr, $.expr)),
      prec.left(6, makeBinaryOperator(choice("*", "/", "%"), $.expr, $.expr)),
      prec.left(5, makeBinaryOperator(choice("+", "-"), $.expr, $.expr)),
      prec.left(4, makeBinaryOperator(choice("<", ">", "<=", ">="), $.expr, $.expr)),
      prec.left(3, makeBinaryOperator(choice("==", "!="), $.expr, $.expr)),
      prec.left(2, makeBinaryOperator("||", $.expr, $.expr)),
      prec.left(1, makeBinaryOperator("&&", $.expr, $.expr)),
    ),
    expr_function: $ => seq(
      "@",
      field("params", $.function_params),
      field("return_type", optional($.type_annotation)),
      field("body", $.block),
    ),
    parentheses: $ => seq(
      "(", $.expr, ")"
    ),
    expr_if: $ => prec.right(seq(
      $.keyword_if,
      field("condition", $.expr),
      choice(
        seq(field("body", $.block), /[ \t]*/),
        seq(field("body", $.expr), /\s*/),
      ),
      repeat($.expr_elif),
      optional($.expr_else)
    )),
    expr_elif: $ => prec.right(seq(
      $.keyword_elif,
      field("condition", $.expr),
      choice(
        seq(field("body", $.block), /[ \t]*/),
        seq(field("body", $.expr), /\s*/),
      ),
    )),
    expr_else: $ => prec.right(seq(
      $.keyword_else,
      choice(
        field("body", $.expr_if),
        field("body", $.block),
        field("body", $.expr),
      ),
    )),
    expr_eval: $ => seq(
      $.keyword_eval,
      field("body", $.block),
    ),
    expr_match: $ => seq(
      $.keyword_match,
      field("target", $.expr),
      field("cases", $.match_cases)
    ),
    match_cases: $ => seq(
      "{",
      optional($._field_delimiter),
      optional(seq(
        $._match_child,
        repeat(seq(
          $._field_delimiter,
          $._match_child,
        )),
      )),
      optional($._field_delimiter),
      "}"
    ),
    _match_child: $ => choice(
      $.match_child_case,
      $.match_child_default
    ),
    match_child_case: $ => seq(
      "case", field("condition", $.expr), "=>", field("body", $.expr)
    ),
    match_child_default: $ => seq(
      "default", "=>", field("body", $.expr)
    ),
    call: $ => seq(
      field("target", choice(
        $.reference,
        $.expr
      )),
      field("params", $.call_params),
    ),
    call_params: $ => seq(
      "(",
      optional(seq(
        $.expr,
        repeat(seq(
          ",",
          $.expr,
        ))
      )),
      ")",
    ),
    type_annotation: $ => seq(":", $.ident),
    type_expr: $ => $.ident,
    destructuring: $ => choice(
      $.destructuring_object,
      $.destructuring_array,
      $.ident
    ),
    destructuring_object: $ => seq(
      "{",
      optional(seq(
        $.destructuring_object_field,
        repeat(seq(
          optional($._field_delimiter),
          $.destructuring_object_field
        )),
        optional($._field_delimiter),
      )),
      "}"
    ),
    destructuring_object_field: $ => choice(
      $._destructuring_object_field_alias,
      $._destructuring_object_field_identity,
    ),
    _destructuring_object_field_identity: $ =>
      field("destructured", $.ident),
    _destructuring_object_field_alias: $ => seq(
      field("target_name", $.ident),
      ":",
      field("destructured", $.destructuring)
    ),
    destructuring_array: $ => seq(
      "[",
      optional(seq(
        $.destructuring_array_field,
        repeat(seq(
          optional($._array_delimiter),
          $.destructuring_array_field
        )),
        optional($._array_delimiter),
      )),
      "]"
    ),
    destructuring_array_field: $ => seq(
      field("destructured", $.destructuring)
    ),
    function_params: $ => seq(
      "(",
      optional(seq(
        $.function_params_field,
        repeat(seq(
          $._list_delimiter,
          $.function_params_field
        )),
      )),
      ")",
    ),
    function_params_field: $ => seq(
      field("name", $.ident),
      field("type", optional($.type_annotation))
    ),
    _linebreak: _ => /[ \t]*[\r\n]\s*/,
    reference: $ => choice(
      prec.left($.index_accessor),
      prec.left($.property_accessor),
      $.namespace_accessor,
      $.ident
    ),
    index_accessor: $ => seq(
      field("target", choice(
        $.literal,
        $.parentheses,
        $.reference
      )),
      "[",
      field("index", $.expr),
      "]"
    ),
    property_accessor: $ => seq(
      field("target", $.expr),
      ".",
      field("property", $.ident)
    ),
    namespace_accessor: $ => prec.left(seq(
      field("target", choice($.namespace_accessor, $.ident)),
      seq(
        ":",
        field("property", $.ident)
      )
    )),
    literal: $ => choice(
      $.null_literal,
      $.bool_literal,
      $.numeric_literal,
      $.string_literal,
      $.array_literal,
      $.object_literal,
    ),
    numeric_literal: $ => choice(
      $.hex_decimal,
      $.decimal,
    ),
    hex_decimal: _ => /0x[0-9A-Fa-f]+/,
    decimal: _ => /[0-9]+(\.[0-9]+)?/,
    string_literal: $ => choice(
      $.back_quote_string_literal,
      $.double_quote_string_literal,
      $.single_quote_string_literal,
    ),
    symbol_back_quote: _ => "`",
    symbol_double_quote: _ => '"',
    symbol_single_quote: _ => "'",
    back_quote_string_literal: $ => seq(
      $.symbol_back_quote,
      field("content", repeat($.back_quote_string_content)),
      $.symbol_back_quote,
    ),
    double_quote_string_literal: $ => seq(
      $.symbol_double_quote,
      field("content", repeat($.double_quote_string_content)),
      $.symbol_double_quote,
    ),
    single_quote_string_literal: $ => seq(
      $.symbol_single_quote,
      field("content", repeat($.single_quote_string_content)),
      $.symbol_single_quote,
    ),
    back_quote_string_text: _ => /[^\\`{}]+/,
    back_quote_string_content: $ => choice(
      $.back_quote_string_text,
      $.string_escape,
      $.back_quote_string_expansion,
    ),
    double_quote_string_text: _ => /[^\\"]+/,
    double_quote_string_content: $ => choice(
      $.double_quote_string_text,
      $.string_escape,
    ),
    single_quote_string_text: _ => /[^\\']+/,
    single_quote_string_content: $ => choice(
      $.single_quote_string_text,
      $.string_escape,
    ),
    back_quote_string_expansion: $ => seq(
      "{", field("expr", $.expr), "}"
    ),
    string_escape: _ => seq("\\", /./),
    array_literal: $ => seq(
      "[",
      optional(seq(
        $.expr,
        repeat(seq(
          $._array_delimiter,
          $.expr
        )),
        optional($._array_delimiter),
      )),
      "]"
    ),
    object_literal: $ => seq(
      "{",
      optional(seq(
        $.object_literal_field,
        repeat(seq(
          $._field_delimiter,
          $.object_literal_field,
        )),
        optional($._field_delimiter),
      )),
      "}"
    ),
    object_literal_field: $ => seq(
      field("key", choice($.ident, $.string_literal)),
      ":",
      field("value", $.expr),
    ),
    bool_literal: $ => choice(
      $.bool_true,
      $.bool_false,
    ),
    keyword_let: _ => "let",
    keyword_var: _ => "var",
    keyword_return: _ => "return",
    keyword_break: _ => "break",
    keyword_continue: _ => "continue",
    keyword_for: _ => "for",
    keyword_each: _ => "each",
    keyword_loop: _ => "loop",
    keyword_while: _ => "while",
    keyword_do: _ => "do",
    keyword_if: _ => "if",
    keyword_elif: _ => "elif",
    keyword_else: _ => "else",
    keyword_eval: _ => "eval",
    keyword_match: _ => "match",
    keyword_exists: _ => "exists",
    null_literal: _ => "null",
    bool_true: _ => "true",
    bool_false: _ => "false",
    symbol_print: _ => "<:",
    symbol_assign: _ => "=",
    symbol_assign_add: _ => "+=",
    symbol_assign_sub: _ => "-=",
    _array_delimiter: _ => choice(
      ",",
      /\s/
    ),
    _field_delimiter: _ => choice(
      ",",
      /[ \t]*[\r\n]\s*/
    ),
    _list_delimiter: _ => ",",
    ident: _ => /[a-zA-Z_][a-zA-Z_0-9]*/
  },
});
