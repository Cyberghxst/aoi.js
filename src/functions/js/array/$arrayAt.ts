import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    assertVariableExists,
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const arrayAt = new AoiJSFunction()
    .setName("$arrayAt")
    .setType(FunctionType.Getter)
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
            name: "index",
            type: "number",
            description: "The index of the array",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Any)
    .setDescription("returns the value of the array at the specified index")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayAt[myArray;1] // returns "hello"
        $arrayAt[myArray;2] // returns "world"
        $arrayAt[myArray;-1] // returns "nya"
    `);

arrayAt.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, index] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    assertVariableExists(currentScope, name, `${data.name}: Variable ${name} doesn't exist`);

    const parsedIndex = (Number(index) <0 ? Number(index) : Number(index)-1);
    if (
        isNaN(parsedIndex) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(`${data.name}: Index must be a number`);

    const res = escapeResult(`${escapeVars(name)}?.at(${parsedIndex})`);
    return thisArg.finishResult(scope, data, res);
}, arrayAt);

export const $arrayAt = arrayAt.build();
