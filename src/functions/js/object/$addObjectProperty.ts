import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    parseData,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const addObjectProperty = new AoiJSFunction()
    .setName("$addObjectProperty")
    .setType(FunctionType.Function)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to add the property to",
            required: true,
        },
        {
            name: "key",
            type: "string",
            description: "The key of the property to add",
            required: true,
        },
        {
            name: "value",
            type: "any",
            description: "The value of the property to add",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("adds a value to the key in the object")
    .setExample(`
        $createObject[object;{key:value}]
        $addObjectProperty[object;key2;value2]
        $getObjectProperty[object;key2] // returns value2
    `);

addObjectProperty.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, key, ...value] = data.splits;
    const parsedValue = parseData(value.join(";"));

    if (
        !value.length &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No Value Provided`);
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
    currentScope.objects[name].addKey(key);
    currentScope.objects[name].addValue(parsedValue);
    const res = escapeResult(`${escapeVars(name)}.${key} = ${parsedValue}`);
    return thisArg.finishResult(scope, data, res);
}, addObjectProperty);

export const $addObjectProperty = addObjectProperty.build();
