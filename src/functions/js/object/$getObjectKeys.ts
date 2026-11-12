import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const getObjectKeys = new AoiJSFunction()
    .setName("$getObjectKeys")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to get the keys from",
            required: true,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["void",])
    .setReturns(ReturnType.Void)
    .setDescription("returns all the key in the object")
    .setExample(`
        $createObject[object;{key:value,key2:value2}]
        $getObjectKeys[object] // returns key, key2
    `);

getObjectKeys.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside as string;

    if (
        !name &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No name Provided`);
    }
    if (
        !currentScope.objects[name] &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name}: Invalid Object Name Provided`,
        );
    }
    const res = escapeResult(`Object.keys(${escapeVars(name)}).join(", ")`);
    return thisArg.finishResult(scope, data, res);
}, getObjectKeys);

export const $getObjectKeys = getObjectKeys.build();
