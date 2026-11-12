import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const cloneObject = new AoiJSFunction()
    .setName("$cloneObject")
    .setType(FunctionType.Setter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to clone",
            required: true,
        },
        {
            name: "target",
            type: "string",
            description: "The name of the object to clone to",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("clones an Object")
    .setExample(`
        $createObject[object;{key:value}]
        $cloneObject[object;object2]
        $getObjectProperty[object2;key] // returns value
    `);

cloneObject.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, target] = data.splits;
    if (
        !currentScope.objects[name] &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name}: Invalid Object Name Provided`,
        );
    }
    currentScope.objects[target] = currentScope.objects[name];
    const res = escapeResult(
        `const ${escapeVars(target)} =  structuredClone(${escapeVars(name)});`,
    );
    currentScope.update(res, data);

    return {
        code: "",
        scope,
    };
}, cloneObject);

export const $cloneObject = cloneObject.build();
