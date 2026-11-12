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

const arrayFilter = new AoiJSFunction()
    .setName("$arrayFilter")
    .setType(FunctionType.ScopeGetter)
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
            name: "query",
            type: "function",
            description: "The query to check",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("filters the array based on the condition")
    .setExample(`
        $arrayCreate[myArray;1;2;3;4;5]
        $arrayFilter[myArray;$env[array_element]<=;5] // returns [1,2,3,4,5]
        $arrayFilter[myArray;$env[array_element]>=;5] // returns [5]
    `);

arrayFilter.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, ...values] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    assertVariableExists(
        currentScope,
        name,
        `${data.name}: Variable ${name} does not exists`,
    );

    const condition = values.join(";");
    const executedCondition = transpileArrayCallback(
        currentScope,
        condition,
        true,
    );

    const res = escapeResult(
        `${escapeVars(name)}.filter(array_element => ${executedCondition})`,
    );

    return thisArg.finishResult(scope, data, res);
}, arrayFilter);

export const $arrayFilter = arrayFilter.build();
