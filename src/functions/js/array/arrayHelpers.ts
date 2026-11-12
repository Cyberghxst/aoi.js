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
        const result = Transpiler(query, {
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
