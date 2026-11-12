import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { assertVariableExists, escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const arrayLength = new AoiJSFunction()
    .setName("$arrayLength")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "array",
            type: "string",
            description: "The name of the array",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the length of an array.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayLength[myArray] // returns 3
    `);

arrayLength.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside as string;

    assertVariableExists(currentScope, name, `${data.name}: Array ${name} does not exist`);

    const res = escapeResult(`${escapeVars(name)}.length`);
    return thisArg.finishResult(scope, data, res);
}, arrayLength);

export const $arrayLength = arrayLength.build();
