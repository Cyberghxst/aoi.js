import funcs from "../functions/index.js";
import { FunctionData, TranspilerOptions, funcData } from "../typings/interfaces.js";
import { MinifyOutput, minify } from "uglify-js";
import {
    getFunctionList,
    parseResult,
    getFunctionData,
    ExecuteData,
} from "../util/transpilerHelpers.js";
import { TranspilerError } from "./error.js";

import fixMath from "./parsers/mathParser.js";
import Scope from "./structs/Scope.js";
import { AsyncFunction } from "../typings/types.js";

/**
 * The result of transpiling aoi.js code: the executable function, the code
 * left after execution, and the scopes the code ran in.
 */
export interface TranspilerResult {
    func: AsyncFunction;
    code: string;
    scope: Scope[];
}

/**
 * Transpiles aoi.js user code (`$function[...]` calls and plain text) into
 * an executable async function.
 *
 * The work runs in phases, each one an instance method so a single phase
 * can be inspected or reused on its own:
 *
 * 1. `buildFunctionList` — merges the built-in `$functions` with the
 *    custom functions from the options and lists the ones used in the code.
 * 2. `normalizeFunctionNames` — rewrites each used `$function` name in the
 *    code to its canonical casing.
 * 3. `buildMainFunction` — wraps the code in a
 *    `$EXECUTEMAINCODEFUNCTION[...]` scope and parses it into function data.
 * 4. `buildGlobalScope` — creates the global {@link Scope} from the options'
 *    scope data.
 * 5. `execute` — runs the function data against the scope to generate
 *    JavaScript, then splices embedded JS back in.
 * 6. `generateCode` — assembles the scope into a JavaScript function and
 *    fixes math expressions.
 * 7. `minifyCode` — minifies the generated code (unless disabled).
 * 8. `evaluate` — evaluates the (minified) code into an `AsyncFunction`.
 *
 * The public entry point is `transpile(code, options)`, which runs the
 * phases in order. The plain `Transpiler(code, options)` function below
 * keeps the historical call shape working by delegating to a fresh
 * instance of this class.
 */
export class TranspilerEngine {
    private options!: TranspilerOptions;
    private code = "";
    private functions: Record<string, FunctionData> = {};
    private functionNames: string[] = [];
    private functionList: string[] = [];
    private mainFunctionData!: funcData;
    private globalScope!: Scope;
    private executionResult!: { code: string; scope: Scope[] };
    private generatedCode = "";

    /**
     * Transpiles aoi.js user code into an executable async function.
     *
     * @param code - The raw user code to transpile.
     * @param options - Transpiler options (scope data, client, minify flag...).
     * @returns The executable function, the generated code, and the scopes.
     */
    transpile(code: string, options: TranspilerOptions): TranspilerResult {
        this.options = options;
        this.code = code;

        this.buildFunctionList();
        this.normalizeFunctionNames();
        this.buildMainFunction();
        this.buildGlobalScope();
        this.execute();
        this.generateCode();
        const functionCode = this.minifyCode();

        if (options.parsedStringOnly) {
            return {
                code: functionCode,
                func: async () => {
                    return void 0;
                },
                scope: this.executionResult.scope,
            };
        }

        const func = this.evaluate(functionCode);
        return { func, ...this.executionResult };
    }

    /**
     * Merges the built-in `$functions` with the custom functions from the
     * options and lists the ones actually used in the code.
     */
    buildFunctionList(): string[] {
        this.functions = { ...funcs, ...this.options.customFunctions };
        this.functionNames = Object.keys(this.functions);
        this.functionList = getFunctionList(this.code, this.functionNames);
        return this.functionList;
    }

    /**
     * Rewrites each used `$function` name in the code to its canonical
     * casing, stripping transpiler markers first.
     */
    normalizeFunctionNames(): void {
        this.functionList.forEach((functionName) => {
            const namePattern = new RegExp(`${functionName.replace("$", "\\$")}`, "gi");
            this.code = parseResult(this.code);
            this.code = this.code.replace(namePattern, functionName);
        });
    }

    /**
     * Wraps the code in a `$EXECUTEMAINCODEFUNCTION[...]` scope so the
     * whole command is treated as one function, and parses it into
     * function data.
     */
    buildMainFunction(): funcData {
        const wrappedCode = `$EXECUTEMAINCODEFUNCTION[
        ${this.code}
    ]`;
        // getFunctionData mutates the function list (it splices out the
        // nested functions it consumes), so the instance list is passed
        // directly, as the old inline version did with its local list.
        this.mainFunctionData = getFunctionData(
            wrappedCode,
            "$EXECUTEMAINCODEFUNCTION",
            this.functionList,
        );
        return this.mainFunctionData;
    }

    /**
     * Creates the global scope the code executes in and fills it from the
     * options' scope data (variables, embeds, env, objects, embed JS,
     * send function and channel).
     */
    buildGlobalScope(): Scope {
        const { scopeData } = this.options;
        this.globalScope = new Scope(
            scopeData?.name ?? "global",
            this.options.client,
            undefined,
            this.code,
        );
        this.globalScope.addVariables(scopeData?.variables ?? []);
        this.globalScope.addEmbeds(scopeData?.embeds ?? []);
        this.globalScope.env.push(...(scopeData?.env ?? []));
        this.globalScope.objects = { ...this.globalScope.objects, ...scopeData?.objects };
        this.globalScope.embededJS = scopeData?.embedJs ?? [];
        this.globalScope.sendFunction =
            scopeData?.sendFunction ?? this.globalScope.sendFunction;
        this.globalScope.useChannel = scopeData?.useChannel;
        return this.globalScope;
    }

    /**
     * Executes the main function's data against the global scope to
     * generate JavaScript, then marks the scope as having send data when
     * there is message content and splices embedded JS back in.
     */
    execute(): { code: string; scope: Scope[] } {
        this.executionResult = ExecuteData(
            parseResult(this.code),
            this.mainFunctionData.funcs,
            [this.globalScope],
            this.options.reverse ?? false,
        );

        if (this.executionResult.scope[0].sendData.content.trim() !== "") {
            const mainScope = this.executionResult.scope[0];
            mainScope.hasSendData = true;
            mainScope.rest = mainScope.replaceLast(mainScope.rest, mainScope.sendData.content.trim(), "");
            this.executionResult.scope[0] = mainScope;
        }
        this.executionResult.scope[0].updateEmbedJs();

        return this.executionResult;
    }

    /**
     * Assembles the executed scope into the final JavaScript function
     * source and fixes math expressions in it.
     */
    generateCode(): string {
        this.generatedCode = this.executionResult.scope[0].getFunction(
            this.options.sendMessage,
        );
        this.generatedCode = fixMath(this.generatedCode);
        return this.generatedCode;
    }

    /**
     * Minifies the generated code when the options ask for it and returns
     * the code to evaluate (the minified code, or the generated code as-is
     * when minification is disabled).
     */
    minifyCode(): string {
        const shouldMinify = this.options.minify;
        // eslint-disable-next-line @typescript-eslint/ban-types
        const functionString = shouldMinify ? minify(this.generatedCode) : this.generatedCode;

        if (shouldMinify && (<MinifyOutput>functionString).error) {
            throw new TranspilerError(
                `
      Failed To Transpile Code with error ${
    (<MinifyOutput>functionString).error
}`,
                {
                    code: this.generatedCode,
                    cmd: this.options.command?.name,
                    path: this.options.command?.__path__,
                },
            );
        }

        return shouldMinify
            ? (<MinifyOutput>functionString).code
            : <string>functionString;
    }

    /**
     * Evaluates (minified) generated code into the executable async
     * function.
     */
    evaluate(code: string): AsyncFunction {
        try {
            return eval(`const f = ${code}; f`) as AsyncFunction;
        } catch (error) {
            throw new TranspilerError(error as string, {
                code: this.generatedCode,
                cmd: this.options.command?.name,
                path: this.options.command?.__path__,
            });
        }
    }
}

/**
 * Transpiles aoi.js user code (`$function[...]` calls and plain text) into
 * an executable async function.
 *
 * Thin wrapper around {@link TranspilerEngine} kept so the historical call
 * shape `Transpiler(code, options)` keeps working (used by the client, the
 * `$function` implementations and the tests).
 *
 * @param code - The raw user code to transpile.
 * @param options - Transpiler options (scope data, client, minify flag...).
 * @returns The executable function, the generated code, and the scopes.
 */
export function Transpiler(
    code: string,
    options: TranspilerOptions,
): TranspilerResult {
    return new TranspilerEngine().transpile(code, options);
}
