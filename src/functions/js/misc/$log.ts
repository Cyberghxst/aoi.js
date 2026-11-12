import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import fixMath from "../../../core/parsers/mathParser.js";
import Scope from "../../../core/structs/Scope.js";
import { parseString } from "../../../core/parsers/stringParser.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeFunctionResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const log = new AoiJSFunction()
    .setName("$log")
    .setType(FunctionType.Function)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "text",
            type: "string",
            description: "The text to log",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("void")
    .setDescription("Logs the text")
    .setExample(`
        $log[hello world] // logs hello world
    `);

log.setCode((data: funcData, scope: Scope[], thisArg) => {

    const splits = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
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
        splits.length !== 1 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires 1 argument`);
    }
    const text = splits[0];
    if (
        text === "" &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires a text`);
    }
    const parsedText = parseString(fixMath(text));
    const res = `${escapeFunctionResult(`console.log(${parsedText});`)}`;
    currentScope.update(res, data);
    return { code: res, scope: scope, data };
}, log);

export const $log = log.build();
