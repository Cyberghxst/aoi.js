import Scope from "../../../core/structs/Scope.js";
import { Transpiler, conditionLexer, functions } from "../../../index.js";
import {
    getFunctionList,
    parseResult,
} from "../../../util/transpilerHelpers.js";
import { TranspilerCustoms } from "../../../typings/enums.js";

/**
 * Array queries separate a comparison operator from its right operand with
 * the field separator (`$arrayFilter[myArray;$env[array_element]<=;5]`
 * means "element <= 5"), because the query is split on `;` and rejoined
 * before it gets here. Drop that one separator so the condition solver
 * sees a plain comparison. Only a `;` directly after an operator is
 * removed, so a `;` inside an operand (e.g. `==a;b`) is left alone.
 * @param {string} condition - The condition to normalize.
 * @returns {string} The condition without the operator/operand separator.
 */
function stripOperatorSeparator(condition: string): string {
    return condition.replace(/(<=|>=|===|!==|==|!=|<|>);/g, "$1");
}

/**
 * The condition solver treats bare words as string literals and wraps them
 * in backticks, but inside an array callback `array_element` is the loop
 * variable, not a string. Wrap bare occurrences (plus an optional
 * `.property` chain, e.g. `array_element.length`) in the transpiler's
 * function markers so the solver leaves them alone as generated code;
 * `parseResult` strips the markers again afterwards. Occurrences already
 * wrapped by a nested `$function` (e.g. `$env[array_element]`) are left
 * untouched.
 * @param {string} condition - The condition to protect.
 * @returns {string} The condition with `array_element` marked as code.
 */
function protectArrayElement(condition: string): string {
    return condition.replace(
        /(?<![\w$#])array_element(\.[A-Za-z_$][\w$]*)*(?![\w$#])/g,
        (match) => `${TranspilerCustoms.FS}${match}${TranspilerCustoms.FE}`,
    );
}

/**
 * A bare `array_element` inside a nested $function's arguments is consumed
 * by that function before the condition solver ever sees it: math Getters
 * turn an unmarked argument into `Number("array_element")` = NaN, and
 * `$log` quotes it as the literal string `"array_element"`. Rewrite those
 * occurrences to `$env[array_element]` first — `$env` compiles to the
 * marked identifier nested functions treat as code, so the element survives
 * into the generated callback.
 *
 * Only occurrences inside a nested `$function[...]` call are rewritten.
 * Top-level occurrences are left alone (the condition solver's protection
 * handles them), as are occurrences already inside `$env[...]` and
 * occurrences inside string literals (where `array_element` is text, not
 * the loop variable).
 * @param {string} query - The raw query code.
 * @returns {string} The query with bare `array_element` arguments wrapped
 * in `$env[...]`.
 */
function rewriteBareArrayElement(query: string): string {
    const isWordChar = (ch: string | undefined) =>
        ch !== undefined && /[\w$]/.test(ch);
    // The outer parser has already replaced `;` inside nested function
    // brackets with `#FUNCTION_SEPARATOR#`, so that marker can sit right
    // next to `array_element` (e.g. `$sum[array_element#FUNCTION_SEPARATOR#1]`)
    // and must be treated as a plain separator, not as part of an
    // identifier. Any other `#...#` marker next to it means the identifier
    // is already protected code and must be left alone.
    const afterSeparator = (pos: number) =>
        query.slice(0, pos).endsWith(TranspilerCustoms.FSEP);
    const beforeSeparator = (pos: number) =>
        query.slice(pos).startsWith(TranspilerCustoms.FSEP);
    const element = "array_element";
    let result = "";
    let i = 0;
    // Open brackets; a `$name[` opener records the function name
    // (lowercased), a plain `[` records null.
    const frames: (string | null)[] = [];
    let quote: string | null = null;
    while (i < query.length) {
        const ch = query[i];
        if (quote !== null) {
            result += ch;
            if (ch === "\\" && i + 1 < query.length) {
                result += query[i + 1];
                i += 2;
                continue;
            }
            if (ch === quote) quote = null;
            i++;
            continue;
        }
        if (ch === "\"" || ch === "'" || ch === "`") {
            quote = ch;
            result += ch;
            i++;
            continue;
        }
        if (ch === "$") {
            const nameMatch = /^\$[A-Za-z_$][\w$]*/.exec(query.slice(i));
            if (nameMatch && query[i + nameMatch[0].length] === "[") {
                frames.push(nameMatch[0].slice(1).toLowerCase());
                result += nameMatch[0] + "[";
                i += nameMatch[0].length + 1;
                continue;
            }
            result += ch;
            i++;
            continue;
        }
        if (ch === "[") {
            frames.push(null);
            result += ch;
            i++;
            continue;
        }
        if (ch === "]") {
            frames.pop();
            result += ch;
            i++;
            continue;
        }
        if (
            query.startsWith(element, i) &&
            !isWordChar(query[i - 1]) &&
            !(query[i - 1] === "#" && !afterSeparator(i))
        ) {
            // Consume an optional `.property` chain, e.g. `array_element.length`.
            let end = i + element.length;
            while (query[end] === ".") {
                const propMatch = /^\.[A-Za-z_$][\w$]*/.exec(query.slice(end));
                if (!propMatch) break;
                end += propMatch[0].length;
            }
            if (
                !isWordChar(query[end]) &&
                !(query[end] === "#" && !beforeSeparator(end))
            ) {
                // The innermost enclosing $function call, if any: plain
                // brackets do not count.
                let innermostFunction: string | null = null;
                for (let f = frames.length - 1; f >= 0; f--) {
                    if (frames[f] !== null) {
                        innermostFunction = frames[f];
                        break;
                    }
                }
                if (innermostFunction !== null && innermostFunction !== "env") {
                    result += `$env[${query.slice(i, end)}]`;
                    i = end;
                    continue;
                }
            }
        }
        result += ch;
        i++;
    }
    return result;
}

/**
 * Shared iteration codegen for the `$array*` functions that take a query
 * over each element (`$arrayEvery`, `$arrayFilter`, `$arrayFind`,
 * `$arrayForEach`, `$arrayMap`).
 *
 * When the query contains other $functions it is transpiled in a scope
 * that exposes the current element as `array_element`, and the generated
 * helper functions and packages are merged into the current scope.
 * Otherwise the query is used as-is.
 *
 * The nested transpiler returns message-content-shaped code, so before the
 * query is inlined it is normalized for a code position: a condition has
 * its `array_element` references protected from the solver's string
 * quoting and its operator/operand `;` separator dropped, while a plain
 * code body has its transpiler markers stripped back to plain JS.
 *
 * @param {Scope} currentScope - The scope the query runs in.
 * @param {string} query - The raw query code (condition or body).
 * @param {boolean} asCondition - Whether the query is a condition: when
 * true it is lexed and solved into a boolean expression, otherwise it is
 * returned as executable code.
 * @returns {string} The transpiled query, ready to inline into the
 * generated `.every` / `.filter` / `.find` / `.forEach` / `.map` call.
 */
export function transpileArrayCallback(
    currentScope: Scope,
    query: string,
    asCondition: boolean,
): string {
    const functionList = getFunctionList(query, Object.keys(functions));
    let executed = query;
    if (functionList.length) {
        // A bare `array_element` inside a nested $function's arguments
        // would be consumed by that function (`$sum` turns it into NaN,
        // `$log` quotes it) before the condition solver can protect it,
        // so rewrite those arguments to `$env[...]` before transpiling.
        // The no-$function path below is untouched: top-level occurrences
        // keep the existing protection.
        const rewrittenQuery = rewriteBareArrayElement(query);
        const result = Transpiler(rewrittenQuery, {
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                name: currentScope.name,
                objects: currentScope.objects,
                env: [...currentScope.env, "array_element"],
            },
            client: currentScope.client,
        });
        currentScope.functions += result.scope[0].functions + "\n";
        currentScope.packages += result.scope[0].packages;
        executed = result.code;
    }
    if (asCondition) {
        executed = protectArrayElement(stripOperatorSeparator(executed));
        return parseResult(conditionLexer(executed).solve());
    }
    // The nested transpiler returns message-content-shaped code: values are
    // wrapped in `#FUNCTION_START#` / `#FUNCTION_END#` markers and math in
    // `#MATH_FUNCTION_START#` / `#MATH_FUNCTION_END#`, which only make sense
    // as `${...}` interpolations inside a template literal. The callback is
    // inlined into real JS code, so strip the markers back to plain JS
    // first — otherwise the generated callback contains `${...}` outside of
    // any template literal and fails to parse.
    return parseResult(executed);
}
