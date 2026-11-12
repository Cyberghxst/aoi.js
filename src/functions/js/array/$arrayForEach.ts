import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    assertVariableExists,
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";
import { transpileArrayCallback } from "./arrayHelpers.js";

const arrayForEach = new AoiJSFunction()
    .setName("$arrayForEach")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the array",
            required: true,
        },
        {
            name: "code",
            type: "function",
            description: "The code to execute",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("for each element in the array, execute the condition")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayForEach[myArray;$log[$env[array_element]]] // logs "hello", "world", "nya"
    `);

arrayForEach.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, ...values] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    assertVariableExists(
        currentScope,
        name,
        `${data.name}: Variable ${name} does not exists`,
    );

    const condition = values.join(";");
    // A forEach query is a code body to run per element, not a condition:
    // running it through the condition solver would wrap the statements in
    // a template literal and break them.
    const executedCode = transpileArrayCallback(
        currentScope,
        condition,
        false,
    );

    const res = escapeResult(
        `${escapeVars(name)}.forEach(async array_element => {
                ${executedCode}
            })`,
    );

    return thisArg.finishResult(scope, data, res);
}, arrayForEach);

export const $arrayForEach = arrayForEach.build();
