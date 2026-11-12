import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    assertVariableExists,
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const arrayIndexOf = new AoiJSFunction()
    .setName("$arrayIndexOf")
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
    .setReturns(ReturnType.Number)
    .setDescription("Returns the index of the first occurrence of a value in an array, or 0 if it is not present.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayIndexOf[myArray;hello] // returns 1

        $arrayIndexOf[myArray;hi] // returns 0
    `);

arrayIndexOf.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, value] = data.splits;

    assertVariableExists(currentScope, name, `${data.name}: Array ${name} does not exist`);

    const res = escapeResult(
        `${escapeVars(name)}.indexOf(${value}) + 1`,
    );
    return thisArg.finishResult(scope, data, res);
}, arrayIndexOf);

export const $arrayIndexOf = arrayIndexOf.build();
