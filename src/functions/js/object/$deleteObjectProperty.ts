import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const deleteObjectProperty = new AoiJSFunction()
    .setName("$deleteObjectProperty")
    .setType(FunctionType.Function)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to delete the property from",
            required: true,
        },
        {
            name: "key",
            type: "string",
            description: "The key of the property to delete",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void", ])
    .setReturns(ReturnType.Void)
    .setDescription("deletes the key in the object")
    .setExample(`
        $createObject[object;{key:value}]
        $deleteObjectProperty[object;key]
        $getObjectProperty[object;key] // returns undefined
    `);

deleteObjectProperty.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, key] = data.splits;

    if (
        !key.length &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No Key Provided`);
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
    const o = currentScope.objects[name];
    const index = o.keys.indexOf(key);
    o.keys.splice(index, 1);
    o.values.splice(index, 1);
    const res = escapeResult(`delete ${escapeVars(name)}.${key}`);
    return thisArg.finishResult(scope, data, res);
}, deleteObjectProperty);

export const $deleteObjectProperty = deleteObjectProperty.build();
