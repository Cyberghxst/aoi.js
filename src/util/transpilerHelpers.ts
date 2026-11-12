import { TranspilerError } from "../core/error.js";
import Scope from "../core/structs/Scope.js";
import FUNCDATA from "../functions/index.js";
import { FunctionData, funcData } from "../typings/interfaces.js";
import { FunctionType, TranspilerCustoms } from "../typings/enums.js";
import { StringObject, parseStringObject } from "../index.js";
import { Command } from "../structures/Command.js";
/**
 * Checks if the brackets in the given code are balanced.
 * @param {string} code - The code to check.
 * @returns {boolean} - Returns true if the brackets are balanced, false otherwise.
 * @example
 * ```js
 * areBracketsBalanced("[]") // true
 * areBracketsBalanced("[[]]") // true
 * areBracketsBalanced("[[]") // false
 * areBracketsBalanced("[]]") // false
 * ```
 */
export function areBracketsBalanced(code: string): boolean {
    const leftBracketPattern = /\[/g;
    const rightBracketPattern = /\]/g;
    const leftBracketCount = code.match(leftBracketPattern)?.length ?? 0;
    const rightBracketCount = code.match(rightBracketPattern)?.length ?? 0;
    return leftBracketCount === rightBracketCount;
}

/**
 * parse data to its actual type
 * @param {string} text - The string to check.
 * @returns {any} - Returns the parsed data.
 * @example
 * ```js
 * parseData("1") // 1
 * parseData("1n") // 1n
 * parseData("null") // null
 * // and so on...
 * ```
 */
export function parseData(text: string) {
    if (text === "") return text;
    else if (!isNaN(Number(text)) && Number.isSafeInteger(Number(text)))
        return Number(text);
    else if (
        (!isNaN(Number(text)) && !Number.isSafeInteger(text)) ||
        isBigInt(text)
    )
        return BigInt(text.replace("n", ""));
    else if (text === "null") return null;
    else if (text === "undefined") return undefined;
    else if (text === "true" || text === "false") return text === "true";
    else {
        try {
            return JSON.parse(text);
        } catch {
            if (text.startsWith("{") && text.endsWith("}")) {
                const stringObject = new StringObject("{");
                stringObject.addEnd("}");
                let evaluatedValue;
                eval(`evaluatedValue = ${parseStringObject(text, stringObject).solve()}`);
                return evaluatedValue;
            } else if (text.startsWith("[") && text.endsWith("]")) {
                const stringObject = new StringObject("[");
                stringObject.addEnd("]");
                let evaluatedValue;
                eval(`evaluatedValue = ${parseStringObject(text, stringObject).solve()}`);
                return evaluatedValue;
            } else return text;
        }
    }
}

/**
 * Escapes a variable name by wrapping it with '__$' and '$__'.
 *
 * @param {string} name - The variable name to escape.
 * @returns {string} The escaped variable name.
 * @example
 * ```js
 * escapeVars("a") // "__$a$__"
 * ```
 */

export function escapeVars(name: string) {
    return `__$${name}$__`;
}

/**
 * Wraps a result string with the transpiler's function-start/end markers so
 * it is recognized as generated code (and not plain message text) while the
 * code is being assembled.
 * @param {string} res - The result string to wrap.
 * @returns {string} The wrapped result string.
 * @example
 * ```js
 * escapeResult("__$a$__") // "#FUNCTION_START#__$a$__#FUNCTION_END#"
 * ```
 */

export function escapeResult(res: string) {
    return `${TranspilerCustoms.FS}${res}${TranspilerCustoms.FE}`;
}

/**
 * Escapes a math result by wrapping it with  TranspilerCustoms.MFS and TranspilerCustoms.MFE.
 * @param {string} res - The math result to escape.
 * @returns {string} The escaped math result.
 * @example
 * ```js
 * escapeMathResult("1+1") // #MATH_FUNCTION_START#1+1#MATH_FUNCTION_END#
 * ```
 * @see {@link TranspilerCustoms}
 */

export function escapeMathResult(res: string) {
    return `${TranspilerCustoms.MFS}${res}${TranspilerCustoms.MFE}`;
}

/**
 * parse the result by removing all the customs
 * @param {string} result - The result to parse.
 * @returns {string} The parsed result.
 * @example
 * ```js
 * parseResult("#MATH_FUNCTION_START#1+1#MATH_FUNCTION_END#") // "1+1"
 * ```
 */

export function parseResult(result: string) {
    if (typeof result !== "string") return result;
    return result
        .replaceAll(TranspilerCustoms.FS, "")
        .replaceAll(TranspilerCustoms.FE, "")
        .replaceAll(TranspilerCustoms.FSEP, ";")
        .replaceAll(TranspilerCustoms.FFUN, "")
        .replaceAll(TranspilerCustoms.FSET, "")
        .replaceAll(TranspilerCustoms.FGET, "")
        .replaceAll(TranspilerCustoms.FISS, "")
        .replaceAll(TranspilerCustoms.FISE, "")
        .replaceAll(TranspilerCustoms.FSS, "")
        .replaceAll(TranspilerCustoms.FSE, "")
        .replaceAll(TranspilerCustoms.FFS, "")
        .replaceAll(TranspilerCustoms.FFE, "")
        .replaceAll(TranspilerCustoms.MFS, "")
        .replaceAll(TranspilerCustoms.MFE, "")
        .replaceAll(TranspilerCustoms.OS, "{")
        .replaceAll(TranspilerCustoms.OE, "}")
        .replaceAll(TranspilerCustoms.OSEP, ":")
        .replaceAll(TranspilerCustoms.AS, "[")
        .replaceAll(TranspilerCustoms.AE, "]")
        .replaceAll(TranspilerCustoms.ASEP, ",");
}

/**
 * remove the set function
 * @param {string} code - The code to parse
 * @returns {string} The parsed result.
 * @example
 * ```js
 * parseResult("#FUNCTION_SETTER#i#FUNCTION_SETTER#") // "i"
 * ```
 */

export function removeSetFunc(code: string) {
    return code
        .replaceAll(TranspilerCustoms.FSET, "")
        .replaceAll(TranspilerCustoms.FFUN, "");
}

/**
 * Wraps a function result string with specific prefix and suffix.
 *
 * @param {string} result - The function result string to wrap.
 * @returns {string} The wrapped function result string.
 *
 * @example
 * ```js
 * escapeFunctionResult("result") // #FUNCTION_FUNCTION_START##FUNCTION_START#result#FUNCTION_END##FUNCTION_FUNCTION_END#
 * ```
 */

export function escapeFunctionResult(result: string) {
    return `${TranspilerCustoms.FFS}${TranspilerCustoms.FS}${result}${TranspilerCustoms.FE}${TranspilerCustoms.FFE}`;
}

/**
 * Throws unless the named variable exists in the given scope. Variables
 * created inside `$try`/`$catch` scopes are exempt because they are only
 * known at runtime. The caller supplies the error message so each
 * function keeps its own wording.
 * @param {Scope} scope - The scope to look the variable up in.
 * @param {string} name - The variable name to check.
 * @param {string} message - The error message to throw when it is missing.
 * @example
 * ```js
 * assertVariableExists(currentScope, "myArray", "$arrayMap: Variable myArray does not exists")
 * ```
 */
export function assertVariableExists(
    scope: Scope,
    name: string,
    message: string,
): void {
    if (
        !scope.variables.includes(name) &&
            !scope.name.startsWith("$try_") &&
            !scope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(message);
    }
}

/**
 * Generates data of the given function in the given code.
 * @param {string} code - The code to generate the function data in.
 * @param {string} func - The function to generate the data of.
 * @param {string[]} functions - The list of valid functions.
 * @param {Command} [command] - The command that the code is in.
 * @returns {funcData} - Returns the generated function data.
 * @example
 * ```js
 * getFunctionData("$ping") // { inside: "", total: "$ping", splits: [], funcs: [], parsed: "$ping", type: FunctionType.Getter, code: [Function (anonymous)] }
 * ```
 */

export function getFunctionData(
    code: string,
    func: string,
    functions: string[],
    command?: Command,
): funcData {
    let functionDefinition = FUNCDATA[func];
    if (func === "$EXECUTEMAINCODEFUNCTION") {
        functionDefinition = {
            name: "$EXECUTEMAINCODEFUNCTION",
            brackets: true,
            optional: false,
            default: ["void"],
            returns: undefined,
            code: (() => {}) as unknown as FunctionData["code"],
            type: FunctionType.Scope,
            fields: [
                {
                    name: "code",
                    type: "string",
                    required: true,
                },
            ],
            description: "Main Execution Function",
            version: "7.0.0",
            example: "N/A",
        };
    }
    const reg = new RegExp(`${func.replace("$", "\\$")}`, "i");
    code = code.replace(reg, func);
    code = code.replaceAll("`", TranspilerCustoms.SL);

    const functionPosition = code.indexOf(func);
    code = code.substring(functionPosition, code.length);

    let leftCount = 0,
        rightCount = 0,
        i = 0;
    let rawTotal = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (i >= code.length) break;
        if (!functionDefinition?.brackets) {
            break;
        }
        if (!functionDefinition?.optional && !code.slice(func.length).startsWith("[")) {
            throw new TranspilerError("Function requires brackets", {
                function: {
                    name: func,
                    code: func,
                },
                cmd: command?.name,
                path: command?.__path__,
            });
        }

        if (rightCount === leftCount && rightCount !== 0) break;
        if (code.slice(func.length)[0] !== "[") {
            break;
        }
        if (code[i] === "[") leftCount++;
        else if (code[i] === "]") rightCount++;
        rawTotal += code[i];
        i++;
    }
    if (rawTotal === "") rawTotal = func;
    if (!areBracketsBalanced(rawTotal) && func !== "$EXECUTEMAINCODEFUNCTION")
        throw new TranspilerError("Brackets are not balanced", {
            function: {
                name: func,
                code: rawTotal,
            },
            cmd: command?.name,
            path: command?.__path__,
        });
    const funcs = [];
    let inside =
        rawTotal.endsWith("]") && rawTotal.startsWith(`${func}[`)
            ? rawTotal.substring(func.length + 1, rawTotal.length - 1)
            : undefined;

    const nestedFunctionNames = getFunctionList(inside || "", functions);

    functions.splice(0, nestedFunctionNames.length);

    let remainingInside = inside || "";
    while (nestedFunctionNames.length) {
        const nestedFunctionName = nestedFunctionNames.shift() || "";
        const nestedFunctionData = getFunctionData(remainingInside, nestedFunctionName, nestedFunctionNames);

        inside = inside?.replace(
            nestedFunctionData.inside?.replaceAll(TranspilerCustoms.FSEP, ";") ?? "",
            nestedFunctionData.parsed,
        );
        remainingInside = remainingInside.replace(nestedFunctionData.total, TranspilerCustoms.F);

        funcs.push(nestedFunctionData);
    }
    const splits = inside?.split(";") || [];
    const parsed = inside?.replaceAll(";", TranspilerCustoms.FSEP);

    return {
        inside,
        total: rawTotal,
        splits,
        funcs,
        parsed: parsed ?? "",
        ...functionDefinition,
    };
}
export const functionFinderRegex = /(\$[a-z]+)/gi;

/**
 * Gets the list of functions in the given code.
 * @param {string} code - The code to get the functions in.
 * @param {string[]} functions - The list of valid functions.
 * @returns {string[]} - Returns the list of functions.
 * @example
 * ```js
 * getFunctionList("$ping") // ["$ping"]
 * ```
 */

export function getFunctionList(code: string, functions: string[]) {
    const rawMatches = code.match(functionFinderRegex);
    if (!rawMatches) return [];
    const matchingFunctions = functions.filter((candidate) =>
        code.toLowerCase().includes(candidate.toLowerCase()),
    );

    const foundFunctions = [];

    for (const raw of rawMatches) {
        const matchedFunction = matchingFunctions.filter(
            (candidate) => candidate.toLowerCase() === raw.toLowerCase().slice(0, candidate.length),
        );
        if (matchedFunction.length === 1) foundFunctions.push(matchedFunction[0]);
        else if (matchedFunction.length > 1) {
            foundFunctions.push(matchedFunction.sort((a, b) => b.length - a.length)[0]);
        } else {
            continue;
        }
    }
    return foundFunctions;
}

/**
 * Deep Reverses the given array of function data.
 * @param {funcData[]} arr - The array of function data to reverse.
 * @returns {funcData[]} - Returns the reversed array of function data.
 */

export function reverseArray(arr: funcData[]) {
    const reversed: funcData[] = [];
    for (let i = arr.length - 1; i >= 0; i--) {
        const element = arr[i];
        if (element.funcs.length) element.funcs = reverseArray(arr[i].funcs);
        reversed.push(element);
    }
    return reversed;
}

/**
 * Reverses the given code and function data.
 * @param {string} code - The code to reverse.
 * @param {funcData[]} funcs - The function data to reverse.
 * @returns {
 * {
 *   code: string;
 *  funcs: funcData[];
 * }
 * } - Returns an object containing the reversed code and function data.
 * @example
 * ```js
 * Reverse("$ping", [{ inside: "", total: "$ping", splits: [], funcs: [], parsed: "$ping", type: FunctionType.Getter, code: [Function (anonymous)] }]) // { code: "$ping", funcs: [{ inside: "", total: "$ping", splits: [], funcs: [], parsed: "$ping", type: FunctionType.Getter, code: [Function (anonymous)] }] }
 * ```
 */

export function Reverse(
    code: string,
    funcs: funcData[],
): {
    code: string;
    funcs: funcData[];
} {
    let codeWithGenericFunctions = code;

    for (const functionData of funcs) {
        codeWithGenericFunctions = codeWithGenericFunctions.replace(
            functionData.total,
            "#GENERIC-FUNCTION#",
        );
    }

    const reversedFuncs = reverseArray(funcs);

    for (const functionData of reversedFuncs) {
        codeWithGenericFunctions = codeWithGenericFunctions.replace(
            "#GENERIC-FUNCTION#",
            functionData.total,
        );
    }

    return { code: codeWithGenericFunctions, funcs: reversedFuncs };
}

/**
 * Executes the given code and function data to generate a js function.
 * @param {string} code - The code to execute.
 * @param {funcData[]} data - The function data to execute.
 * @param {Scope[]} scope - The scope to execute the code in.
 * @param {boolean} [reverse=false] - Whether to reverse the code and function data or not.
 * @returns {
 * {
 *   code: string;
 *  scope: Scope[];
 * }
 * } - Returns an object containing the generated js function and the scope.
 * @example
 * ```js
 * ExecuteData("$ping", [{ inside: "", total: "$ping", splits: [], funcs: [], parsed: "$ping", type: FunctionType.Getter, code: [Function (anonymous)] }], []) // { code: "__$DISCORD_DATA$__.client.ws.data.ping", scope: [] }
 * ```
 */

export function ExecuteData(
    code: string,
    data: funcData[],
    scope: Scope[],
    reverse = false,
) {
    let i = 0;

    if (reverse) {
        const { code: newCode, funcs } = Reverse(code, data);
        code = newCode;
        data = funcs;
        scope[0].rest = code;
    }
    while (i < data.length) {
        let currentFunction = data[i];

        const previousTotal = data[i].total;
        if (currentFunction.type === FunctionType.Scope || currentFunction.type === FunctionType.ScopeGetter) {
            const result = currentFunction.code(currentFunction, scope);
            scope = result.scope;
            currentFunction = <funcData>result.data;

            code = code.replace(currentFunction.total, result.code.replaceAll("$", "$$$$"));
            // .replace(currentFunction.total.replaceAll(";", "#FUNCTION_SEPARATOR#"), result.code);
            if (currentFunction.type === FunctionType.ScopeGetter) {
                currentFunction.total = removeFF(currentFunction.total);
                scope[scope.length - 1].sendData.content = scope[
                    scope.length - 1
                ].sendData.content.replace(
                    currentFunction.total,
                    result.code.replaceAll("$", "$$$$"),
                );
            }
        } else {
            let executed: {
                code: string;
                scope: Scope[];
            };

            if (currentFunction.funcs.length) {
                executed = ExecuteData(
                    parseResult(currentFunction.inside ?? ""),
                    currentFunction.funcs,
                    scope,
                );

                scope = executed.scope;

                const oldTotal = currentFunction.total;

                currentFunction.total = currentFunction.total
                    .replace(
                        currentFunction.inside ?? "",
                        executed.code.replaceAll("$", "$$$$"),
                    )
                    .replace(
                        currentFunction.inside?.replaceAll(TranspilerCustoms.FSEP, ";") ?? "",
                        executed.code.replaceAll("$", "$$$$"),
                    );

                code = code
                    .replace(oldTotal, currentFunction.total.replaceAll("$", "$$$$"))
                    .replace(previousTotal, currentFunction.total.replaceAll("$", "$$$$"));

                currentFunction.inside = executed.code;
                currentFunction.splits = currentFunction.inside.split(";");

                const result = currentFunction.code(currentFunction, scope);

                code = code
                    .replace(currentFunction.total, result.code.replaceAll("$", "$$$$"))
                    // .replace(currentFunction.total.replaceAll(";", "#FUNCTION_SEPARATOR#"), result.code)
                    .replace(previousTotal, result.code.replaceAll("$", "$$$$"));

                if (currentFunction.type === FunctionType.Getter || currentFunction.type === FunctionType.FunctionGetter) {
                    let previousContent = scope[scope.length - 1].sendData.content;
                    scope[scope.length - 1].sendData.content = scope[
                        scope.length - 1
                    ].sendData.content.replace(
                        currentFunction.total,
                        result.code.replaceAll("$", "$$$$"),
                    );
                    if (
                        previousContent === scope[scope.length - 1].sendData.content
                    ) {
                        scope[scope.length - 1].sendData.content = scope[
                            scope.length - 1
                        ].sendData.content.replace(
                            currentFunction.total.replaceAll(";", TranspilerCustoms.FSEP),
                            result.code.replaceAll("$", "$$$$"),
                        );
                        previousContent = scope[scope.length - 1].sendData.content;
                    }
                    if (previousContent === scope[scope.length - 1].sendData.content)
                        scope[scope.length - 1].sendData.content = scope[
                            scope.length - 1
                        ].sendData.content.replace(
                            previousTotal,
                            result.code.replaceAll("$", "$$$$"),
                        );
                }
            } else {
                executed = currentFunction.code(currentFunction, scope);
                scope = executed.scope;

                code = code.replace(
                    currentFunction.total,
                    executed.code.replaceAll("$", "$$$$"),
                );

                if (currentFunction.type === FunctionType.Getter || currentFunction.type === FunctionType.FunctionGetter) {
                    const oldTotal = currentFunction.total;
                    const previousContent = scope[scope.length - 1].sendData.content;
                    currentFunction.total = removeFF(currentFunction.total);
                    scope[scope.length - 1].sendData.content = scope[
                        scope.length - 1
                    ].sendData.content.replace(
                        currentFunction.total,
                        executed.code.replaceAll("$", "$$$$"),
                    );
                    if (previousContent === scope[scope.length - 1].sendData.content)
                        scope[scope.length - 1].sendData.content = scope[
                            scope.length - 1
                        ].sendData.content.replace(
                            oldTotal,
                            executed.code.replaceAll("$", "$$$$"),
                        );
                }
            }
        }
        if (
            currentFunction.type !== FunctionType.Getter &&
            currentFunction.type !== FunctionType.FunctionGetter &&
            currentFunction.type !== FunctionType.ScopeGetter
        ) {
            const currentScope = scope[scope.length - 1];
            const oldTotal = currentFunction.total;
            const previousContent = currentScope.sendData.content;
            currentFunction.total = removeFF(currentFunction.total);
            currentScope.sendData.content = currentScope.sendData.content.replace(currentFunction.total, "");
            if (previousContent === currentScope.sendData.content)
                currentScope.sendData.content = currentScope.sendData.content.replace(oldTotal, "");
            scope[scope.length - 1] = currentScope;
        }
        i++;
    }
    return {
        code,
        scope,
    };
}

/**
 * converts the given string to boolean
 * @param {string} output - The string to convert.
 * @returns {boolean} - Returns the converted boolean.
 * @example
 * ```js
 * convertToBool("true") // true
 * convertToBool("yes") // true
 * convertToBool("false") // false
 * convertToBool("no") // false
 * ```
 */
export function convertToBool(output: string) {
    return output === "true" || output === "yes";
}

/**
 * removes the FF transpiler customs
 * @param {string} total - The string to remove the customs from.
 * @returns {string} - Returns the string without the customs.
 */
export function removeFF(total: string) {
    if (!total.includes(TranspilerCustoms.FFS)) return total;
    const parts = total.split(TranspilerCustoms.FFS).slice(1);
    let i = 0;
    while (i < parts.length) {
        const part = parts[i].split(TranspilerCustoms.FFE)[0];
        total = total.replace(part, "");
        i++;
    }
    return parseResult(total);
}

export function removeF(total: string) {
    if (!total.includes(TranspilerCustoms.FS)) return total;
    const parts = total.split(TranspilerCustoms.FS).slice(1);
    let i = 0;
    while (i < parts.length) {
        const part = parts[i].split(TranspilerCustoms.FE)[0];
        total = total.replace(part, "");
        i++;
    }
    return total;
}

export function removeMF(total: string) {
    if (!total.includes(TranspilerCustoms.MFS)) return total;
    const parts = total.split(TranspilerCustoms.MFS).slice(1);
    let i = 0;
    while (i < parts.length) {
        const part = parts[i].split(TranspilerCustoms.MFE)[0];
        total = total.replace(part, "");
        i++;
    }
    return total;
}

/**
 * Checks if the given string is a bigint.
 * @param {string} value - The string to check.
 * @returns {boolean} - Returns true if the string is a bigint, false otherwise.
 * @example
 * ```js
 * isBigInt("1n") // true
 * isBigInt("1") // false
 * ```
 */

export function isBigInt(value: string) {
    return value.match(/^-?\d+n$/) !== null;
}

/**
 * Removes the multi line comments from the given code.
 * @param {string} code - The code to remove the comments from.
 * @returns {string} - Returns the code without the comments.
 * @example
 * ```js
 * removeMultiLineComments("/* comment *\/") // ""
 * ```
 */
export function removeMultiLineComments(code: string) {
    return code.replace(/\/\*[\s\S]*?\*\//g, "");
}
