import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { Scope, TranspilerError, funcData, parseString } from "../../../index.js";
import { convertToBool, escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const jseval = new AoiJSFunction()
    .setName("$jseval")
    .setType(FunctionType.FunctionGetter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "output",
            type: "string",
            description: "Whether to output the result of the code",
            required: true,
        },
        {
            name: "code",
            type: "string",
            description: "The code to evaluate",
            required: true,
        },
    ])
    .setVersion("1.0.0")
    .setDefault(["void", "void"])
    .setReturns("any")
    .setDescription("Evaluates the provided Js code")
    .setExample(`
        $jsEval[false;log("hello world")]
    `);

jseval.setCode((data: funcData, scope: Scope[], thisArg) => {
    const splits = data.splits;
    const [output, ...code] = splits;
    const currentScope = thisArg.getCurrentScope(scope);
    const parsedOutput = convertToBool(output);
    if (thisArg.brackets) {
        if (
            !data.total.startsWith(thisArg.name + "[") &&
                (!currentScope.name.startsWith("$try_") ||
                    !currentScope.name.startsWith("$catch_"))
        ) {
            throw new TranspilerError(
                `${data.name} requires closure brackets`,
            );
        }
    }
    if (
        splits.length < 2 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires 2 arguments`);
    }

    const Code = parseString(code.join(";"));
    if (
        !currentScope.functions.includes(
            "async function __$jseval$__(Code) {",
        )
    ) {
        const setres = `
    async function __$jsEval$__(Code) {
      try {
        const evaled =  await eval(Code);
        return evaled;
      } catch (e) {
        return e;
      }
    }`;
        currentScope.functions += escapeResult(setres) + "\n";
    }
    const res = `${escapeResult(
        `await __$jsEval$__.call(__$DISCORD_DATA$__,${Code})`,
    ) }`;

    currentScope.rest = currentScope.rest.replace(data.total, res);
    return {
        code: parsedOutput ? res : "",
        scope: scope,
    };
}, jseval);

export const $jseval = jseval.build();
