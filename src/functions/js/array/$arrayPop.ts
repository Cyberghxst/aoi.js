import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayPop = new AoiJSFunction()
    .setName("$arrayPop")
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
    .setReturns("any")
    .setDescription("Removes the last element from an array and returns that element. This method changes the length of the array.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayPop[myArray] // returns nya
    `);

arrayPop.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside as string;

    if (
        !currentScope.variables.includes(name) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: Array ${name} does not exist`,
        );

    const res = escapeResult(`${escapeVars(name)}.pop()`);

    return {
        code: res,
        scope,
    };
}, arrayPop);

export const $arrayPop = arrayPop.build();
