(numeric_literal) @constant.numeric
(string_escape) @constant.character.escape
[
  (symbol_back_quote)
  (symbol_double_quote)
  (symbol_single_quote)
  (back_quote_string_text)
  (double_quote_string_text)
  (single_quote_string_text)
] @string

[
  (bool_literal)
  (null_literal)
] @constant.builtin

(comment) @comment

[
  ","
] @punctuation.delimiter

[
  (keyword_let)
  (keyword_var)
  (keyword_return)
  (keyword_break)
  (keyword_continue)
  (keyword_for)
  (keyword_each)
  (keyword_loop)
  (keyword_while)
  (keyword_do)
  (keyword_if)
  (keyword_elif)
  (keyword_else)
  (symbol_print)
] @keyword

[
  "+"
  "-"
  "*"
  "/"
  "^"
  "%"
  "<"
  ">"
  "<="
  ">="
  "=="
  "!="
  "&&"
  "||"
] @keyword.operator

[
  (symbol_assign)
  (symbol_assign_add)
  (symbol_assign_sub)  
] @keyword.operator

(stmt_function
  name: (_) @function.method) @definition.function

(stmt_function "@" @keyword)

(expr_function) @definition.function

(expr_function "@" @keyword)

(function_params_field
  name: (_) @variable.parameter)

(type_annotation
  (ident) @type)

(namespace_accessor
  target: (_ (ident)) @namespace)

(namespace
  name: (_) @namespace)

(namespace "::" @keyword)
