import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const getObjectProperty = new AoiJSFunction()
    .setName("$getObjectProperty")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to get the property from",
            required: true,
        },
        {
            name: "key",
            type: "string",
            description: "The key of the property to get",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("gets the value of the key in the object")
    .setExample(`
        $createObject[object;{key:value}]
        $getObjectProperty[object;key] // returns value
    `);

getObjectProperty.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, key ] = data.splits;

    if (
        !currentScope.objects[name] &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name}: Invalid Object Name Provided`,
        );
    }
    const res = escapeResult(`${escapeVars(name)}.${key}`);
    return thisArg.finishResult(scope, data, res);
}, getObjectProperty);

export const $getObjectProperty = getObjectProperty.build();
