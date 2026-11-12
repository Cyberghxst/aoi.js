import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

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
    .setReturns("number")
    .setDescription("Returns the length of an array.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayLength[myArray] // returns 3
    `);

arrayLength.setCode((data: funcData, scope: Scope[], thisArg) => {
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

    const res = escapeResult(`${escapeVars(name)}.length`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, arrayLength);

export const $arrayLength = arrayLength.build();
