import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const getObjectValues = new AoiJSFunction()
    .setName("$getObjectValues")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to get the values from",
            required: true,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["void",])
    .setReturns("void")
    .setDescription("returns all the values in the object")
    .setExample(`
        $createObject[object;{key:value,key2:value2}]
        $getObjectValues[object] // returns value, value2
    `);

getObjectValues.setCode((data: funcData, scope: Scope[], thisArg) => {
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
    const res = escapeResult(`Object.values(${escapeVars(name)}).join(", ")`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, getObjectValues);

export const $getObjectValues = getObjectValues.build();
