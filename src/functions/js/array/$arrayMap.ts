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

const arrayMap = new AoiJSFunction()
    .setName("$arrayMap")
    .setType(FunctionType.ScopeGetter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            required: true,
        },
        {
            name: "query",
            type: "function",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Array)
    .setDescription("maps the array based on the code")
    .setExample(`
        $arrayCreate[myArray;1;2;3;4;5]
        $arrayMap[myArray;$sum[$env[array_element];1]] // returns [2,3,4,5,6]
    `);

arrayMap.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, ...values] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    assertVariableExists(
        currentScope,
        name,
        `${data.name}: Variable ${name} does not exists`,
    );

    const code = values.join(";");

    const executedCode = transpileArrayCallback(currentScope, code, false);

    const res = escapeResult(`
                ${escapeVars(name)}.map(array_element => {
                    ${executedCode}
                    })`);

    return thisArg.finishResult(scope, data, res);
}, arrayMap);

export const $arrayMap = arrayMap.build();
