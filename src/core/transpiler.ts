import funcs from "../functions/index.js";
import { TranspilerOptions } from "../typings/interfaces.js";
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
 * Transpiles aoi.js user code (`$function[...]` calls and plain text) into
 * an executable async function.
 *
 * The code is wrapped in a `$EXECUTEMAINCODEFUNCTION[...]` scope so the
 * whole command is treated as one function, each `$function` is parsed and
 * executed to generate JavaScript, the result is minified (unless disabled)
 * and evaluated into an `AsyncFunction` that sends the final message when
 * called with the Discord data.
 *
 * @param code - The raw user code to transpile.
 * @param options - Transpiler options (scope data, client, minify flag...).
 * @returns The executable function, the generated code, and the scopes.
 */
export function Transpiler(
    code: string,
    options: TranspilerOptions,
): { func: AsyncFunction; code: string; scope: Scope[] } {
    const { scopeData, sendMessage, minify: shouldMinify, customFunctions } = options;
    const functions = { ...funcs, ...customFunctions };
    const functionNames = Object.keys(functions);
    const functionList = getFunctionList(code, functionNames);

    functionList.forEach((functionName) => {
        const namePattern = new RegExp(`${functionName.replace("$", "\\$")}`, "gi");
        code = parseResult(code);
        code = code.replace(namePattern, functionName);
    });

    const wrappedCode = `$EXECUTEMAINCODEFUNCTION[
        ${code}
    ]`;
    const mainFunctionData = getFunctionData(wrappedCode, "$EXECUTEMAINCODEFUNCTION", functionList);
    const globalScope = new Scope(
        scopeData?.name ?? "global",
        options.client,
        undefined,
        code,
    );
    globalScope.addVariables(scopeData?.variables ?? []);
    globalScope.addEmbeds(scopeData?.embeds ?? []);
    globalScope.env.push(...(scopeData?.env ?? []));
    globalScope.objects = { ...globalScope.objects, ...scopeData?.objects };
    globalScope.embededJS = scopeData?.embedJs ?? [];
    globalScope.sendFunction =
        scopeData?.sendFunction ?? globalScope.sendFunction;
    globalScope.useChannel = scopeData?.useChannel;
    const executionResult = ExecuteData(
        parseResult(code),
        mainFunctionData.funcs,
        [globalScope],
        options.reverse ?? false,
    );

    if (executionResult.scope[0].sendData.content.trim() !== "") {
        const mainScope = executionResult.scope[0];
        mainScope.hasSendData = true;
        mainScope.rest = mainScope.replaceLast(mainScope.rest, mainScope.sendData.content.trim(), "");
        executionResult.scope[0] = mainScope;
    }
    executionResult.scope[0].updateEmbedJs();

    let generatedCode = executionResult.scope[0].getFunction(sendMessage);
    generatedCode = fixMath(generatedCode);

    // eslint-disable-next-line @typescript-eslint/ban-types
    const functionString = shouldMinify ? minify(generatedCode) : generatedCode;

    if (shouldMinify && (<MinifyOutput>functionString).error) {
        throw new TranspilerError(
            `
      Failed To Transpile Code with error ${
    (<MinifyOutput>functionString).error
}`,
            {
                code: generatedCode,
                cmd: options.command?.name,
                path: options.command?.__path__,
            },
        );
    }
    let func;

    if (options.parsedStringOnly)
        return {
            code: shouldMinify
                ? (<MinifyOutput>functionString).code
                : <string>functionString,
            func: async () => {
                return void 0;
            },
            scope: executionResult.scope,
        };
    try {
        const codeToEvaluate = shouldMinify
            ? (<MinifyOutput>functionString).code
            : <string>functionString;
        func = eval(`const f = ${codeToEvaluate}; f`) as AsyncFunction;
    } catch (error) {
        throw new TranspilerError(error as string, {
            code: generatedCode,
            cmd: options.command?.name,
            path: options.command?.__path__,
        });
    }

    return { func, ...executionResult };
}
