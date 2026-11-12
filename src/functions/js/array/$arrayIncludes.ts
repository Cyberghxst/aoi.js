import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { assertVariableExists, escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const arrayIncludes = new AoiJSFunction()
    .setName("$arrayIncludes")
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
        {
            name: "value",
            type: "string",
            description: "The value to check",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Boolean)
    .setDescription("Checks if array includes value")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayIncludes[myArray;hello] // returns true
        $arrayIncludes[myArray;hi] // returns false
    `);

arrayIncludes.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, value] = data.splits;

    assertVariableExists(currentScope, name, `${data.name}: Array ${name} does not exist`);

    const res = escapeResult(`${escapeVars(name)}.includes(${value})`);
    return thisArg.finishResult(scope, data, res);
}, arrayIncludes);

export const $arrayIncludes = arrayIncludes.build();
