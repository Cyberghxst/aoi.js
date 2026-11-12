import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayJoin = new AoiJSFunction()
    .setName("$arrayJoin")
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
            name: "separator",
            type: "string",
            description: "The separator to join the array with",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", ", "])
    .setReturns("string")
    .setDescription("Joins all elements of an array into a string.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayJoin[myArray] // returns hello, world, nya
    
        $arrayJoin[myArray; | ] // returns hello | world | nya
    `);

arrayJoin.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, separator = ", "] = data.splits;

    if (
        !currentScope.variables.includes(name) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: Array ${name} does not exist`,
        );

    const res = escapeResult(`${escapeVars(name)}.join(${separator})`);
    currentScope.update(res, data);

    return {
        code: res,
        scope,
    };
}, arrayJoin);

export const $arrayJoin = arrayJoin.build();
