/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionData, Scope, TranspiledFuncData, funcData } from "../index.js";
import { FunctionType, ReturnType } from "../typings/enums.js";
import { inspect } from "util";

/**
 * Builder for a single $function. Every built-in and custom function is
 * described with this builder: its name, whether it takes brackets, its
 * fields, and a `code` callback that generates the JavaScript the
 * transpiler inlines for it.
 *
 * The generated code is produced by stringifying small helper functions
 * and replacing `$0`, `$1`, ... placeholders with the caller's actual
 * arguments, so a function's code must be written with those
 * placeholders in mind.
 */
export default class AoiJSFunction {
    name!: string;
    type!: FunctionType;
    brackets!: boolean;
    optional!: boolean;
    fields!: FunctionData["fields"];
    version!: string;
    default!: string[];
    returns!: ReturnType;
    description!: string;
    example!: string;
    code!: FunctionData["code"];
    /** Sets the function's name, as used in code (for example `$ping`). */
    setName(name: string) {
        this.name = name;
        return this;
    }
    setType(type: FunctionType) {
        this.type = type;
        return this;
    }
    /** Sets whether the function is called with brackets (`$name[...]`) or bare (`$name`). */
    setBrackets(brackets: boolean) {
        this.brackets = brackets;
        return this;
    }
    /** Sets whether the function may be used without arguments. */
    setOptional(optional: boolean) {
        this.optional = optional;
        return this;
    }
    /** Sets the documented fields (arguments) of the function. */
    setFields(fields: FunctionData["fields"]) {
        this.fields = fields;
        return this;
    }
    /** Sets the aoi.js version the function was introduced in. */
    setVersion(version: string) {
        this.version = version;
        return this;
    }
    /** Sets the default values used when an argument is omitted. */
    setDefault(defaults: string[]) {
        this.default = defaults;
        return this;
    }
    /** Sets a description of what the function returns. */
    setReturns(returns: ReturnType) {
        this.returns = returns;
        return this;
    }
    /** Sets the human-readable description shown in the docs. */
    setDescription(description: string) {
        this.description = description;
        return this;
    }
    /** Sets a usage example shown in the docs. */
    setExample(example: string) {
        this.example = example;
        return this;
    }
    /**
     * Sets the code generator. It receives the parsed call data and the
     * scope stack, and returns the generated code plus the updated
     * scope. The builder passes itself as `thisArg` so the generator
     * can use the helper methods below.
     */
    setCode(
        code: (
            data: funcData,
            scope: Scope[],
            thisArg: AoiJSFunction
        ) => { code: string; scope: Scope[]; data?: funcData },
        thisArg: AoiJSFunction
    ) {
        this.code = function (data, scope) {
            return code(data, scope, thisArg);
        };
        return this;
    }
    /** Returns the innermost scope on the stack (the one code is currently generated into). */
    getCurrentScope(scope: Scope[]) {
        return scope[scope.length - 1];
    }
    /** Returns the parsed arguments (`splits`) of a function call. */
    getParams(data: funcData) {
        return data.splits;
    }

    /**
     * Finishes a code generator with a computed, already-escaped result:
     * feeds it into the current scope and returns the `{ code, scope,
     * data }` triple the transpiler expects. Most $functions end their
     * `setCode` callback this way.
     *
     * The escaping itself stays in the caller because different function
     * families escape differently (`escapeResult`, `escapeMathResult`,
     * `escapeFunctionResult`), so this helper takes the finished result
     * string as-is.
     */
    finishResult(
        scope: Scope[],
        data: funcData,
        result: string,
    ): { code: string; scope: Scope[]; data: funcData } {
        const currentScope = this.getCurrentScope(scope);
        currentScope.update(result, data);
        return { code: result, scope, data };
    }

    /** Replaces a scope's setter code with the given value. */
    setSetter(scope: Scope, value: string) {
        scope.setters = value;
    }

    /** Appends to a scope's setter code. */
    updateSetter(scope: Scope, value: string) {
        scope.setters += value;
    }

    /**
     * Stringifies a helper function, replaces its `$0`, `$1`, ...
     * placeholders with the given values, and appends the result to a
     * scope's generated functions. Arrow functions are rewritten as
     * named `function` declarations because the generated code is
     * concatenated as top-level statements.
     */
    updateFunction(
        scope: Scope,
        func: (discord: TranspiledFuncData, arg?: unknown[]) => unknown,
        vars?: unknown[]
    ) {
        const stringifyFunction = func.toString();
        const functionName = inspect(func)
            .replace("[Function:", "")
            .replace("]", "")
            .trim();

        const es5Regex =
      /^(?:(?:\/\*[^(?:*/)]*\*\/\s*)|(?:\/\/[^\r\n]*))*\s*(?:(?:(?:async\s(?:(?:\/\*[^(?:*/)]*\*\/\s*)|(?:\/\/[^\r\n]*))*\s*)?function|class)(?:\s|(?:(?:\/\*[^(?:*/)]*\*\/\s*)|(?:\/\/[^\r\n]*))*)|(?:[_$\w][\w0-9_$]*\s*(?:\/\*[^(?:*/)]*\*\/\s*)*\s*\()|(?:\[\s*(?:\/\*[^(?:*/)]*\*\/\s*)*\s*(?:(?:['][^']+['])|(?:["][^"]+["]))\s*(?:\/\*[^(?:*/)]*\*\/\s*)*\s*\]\())/;

        const isEs6 = !es5Regex.test(stringifyFunction);
        const findNumbersRegex = /\$[0-9]+/g;
        let functionToUpdate = "";
        if (isEs6) {
            functionToUpdate = `function ${functionName} ${stringifyFunction.replace(
                "=>",
                ""
            )}`;
        } else {
            functionToUpdate = stringifyFunction;
        }
        const placeholders = functionToUpdate.match(findNumbersRegex);
        if (placeholders?.length && vars?.length) {
            for (const placeholder of placeholders) {
                const index = parseInt(placeholder.replace("$", ""));
                functionToUpdate = functionToUpdate
                    .replaceAll(`"${placeholder}"`, vars[index] as string)
                    .replaceAll(`'${placeholder}'`, vars[index] as string);
            }
        }
        scope.functions += functionToUpdate + "\n";
    }

    /** Whether a helper function with the given name was already added to the scope. */
    hasFunction(scope: Scope, funcName: string) {
        return scope._funcList.includes(funcName);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /**
     * Turns a small arrow function into generated code: its parameter
     * is renamed to the shared `__$DISCORD_DATA$__` variable, the arrow
     * and any surrounding braces are stripped, and its `$0`, `$1`, ...
     * placeholders are replaced with the given arguments.
     */
    getResultString(
        func: (__$DISCORD_DATA$__: TranspiledFuncData) => any,
        args: any[]
    ): string {
        const body = func.toString();
        const matchWholeArgWithAsync = /(async\s*)?\(?\s*(\w)*\s*\)?(?=\s*=>)/;
        const argRegex = /\(?\s*(\w)*\s*\)?(?=\s*=>)/;
        const getArg = body.match(argRegex);
        if (!getArg) throw new Error("Function Arg must be present");
        const arg = getArg[0].replace("(", "").replace(")", "").trim();
        let bodyWithoutArg = body.replace(matchWholeArgWithAsync, "");
        bodyWithoutArg = this.#replaceArgInFunctionStringWithDiscord(
            bodyWithoutArg,
            arg
        );
        const removedArrow = bodyWithoutArg.replace("=>", "").trim();

        const bodyWithoutBrackets =
            removedArrow[0] === "{" ? removedArrow.slice(1, -1) : removedArrow;
        const findNumbersRegex = /\$[0-9]+/g;
        const placeholders = bodyWithoutBrackets.match(findNumbersRegex);

        if (!placeholders) {
            return bodyWithoutBrackets;
        }

        let result = bodyWithoutBrackets;
        for (const placeholder of placeholders) {
            const index = parseInt(placeholder.replace("$", ""));
            result = result
                .replaceAll(`"${placeholder}"`, args[index])
                .replaceAll(`'${placeholder}'`, args[index]);
        }
        return result;
    }

    /** Collects every field set on this builder into a plain function definition. */
    build(): FunctionData {
        return {
            name: this.name,
            type: this.type,
            brackets: this.brackets,
            optional: this.optional,
            fields: this.fields,
            version: this.version,
            default: this.default,
            returns: this.returns,
            description: this.description,
            example: this.example,
            code: this.code,
        };
    }

    #replaceArgInFunctionStringWithDiscord(func: string, arg: string) {
    // it will replace all arg with __$DISCORD_DATA$__ and wont replace same word if it is a part of another word or a property

        const regex = new RegExp(`(?<![a-zA-Z0-9_.])(${arg})(?![a-zA-Z0-9_])`, "g");
        return func.replaceAll(regex, "__$DISCORD_DATA$__");
    }

    /**
     * Returns the generated code of one of two functions depending on
     * a condition, so a $function can pick between two code paths at
     * transpile time without duplicating the branching logic.
     */
    conditionalGetResultString(
        condition: boolean,
        trueData: {
            func: (__$DISCORD_DATA$__: TranspiledFuncData) => unknown;
            args: unknown[];
        },
        falseData: {
            func: (__$DISCORD_DATA$__: TranspiledFuncData) => unknown;
            args: unknown[];
        }
    ): string {
        if (condition) return this.getResultString(trueData.func, trueData.args);
        return this.getResultString(falseData.func, falseData.args);
    }
}
