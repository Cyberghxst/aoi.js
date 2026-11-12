import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayLastIndexOf = new AoiJSFunction()
    .setName("$arrayLastIndexOf")
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
    .setReturns("number")
    .setDescription("Returns the index of the last occurrence of a value in an array, or 0 if it is not present.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya;hello]
        $arrayLastIndexOf[myArray;hello] // returns 4

        $arrayLastIndexOf[myArray;hi] // returns 0
    `);

arrayLastIndexOf.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, value] = data.splits;

    if (
        !currentScope.variables.includes(name) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: Array ${name} does not exist`,
        );

    const res = escapeResult(
        `${escapeVars(name)}.lastIndexOf(${value}) + 1`,
    );
    currentScope.update(res, data);

    return {
        code: res,
        scope,
    };
}, arrayLastIndexOf);

export const $arrayLastIndexOf = arrayLastIndexOf.build();
