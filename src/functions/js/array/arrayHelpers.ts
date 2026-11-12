import Scope from "../../../core/structs/Scope.js";
import { Transpiler, conditionLexer, functions } from "../../../index.js";
import {
    getFunctionList,
    parseResult,
} from "../../../util/transpilerHelpers.js";

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
        return parseResult(conditionLexer(executed).solve());
    }
    return executed;
}
