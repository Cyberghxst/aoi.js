import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { assertVariableExists, escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

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
    .setReturns(ReturnType.String)
    .setDescription("Joins all elements of an array into a string.")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayJoin[myArray] // returns hello, world, nya
    
        $arrayJoin[myArray; | ] // returns hello | world | nya
    `);

arrayJoin.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, separator = ", "] = data.splits;

    assertVariableExists(currentScope, name, `${data.name}: Array ${name} does not exist`);

    const res = escapeResult(`${escapeVars(name)}.join(${separator})`);
    return thisArg.finishResult(scope, data, res);
}, arrayJoin);

export const $arrayJoin = arrayJoin.build();
