import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const objectExists = new AoiJSFunction()
    .setName("$objectExists")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to check",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("object")
    .setDescription("returns whether object exists or not")
    .setExample(`
        $createObject[object;{key:value}]
        $objectExists[object] // returns true

        $objectExists[object2] // returns false
    `);

objectExists.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside;
    if (
        !name &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.endsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No Object Name Provided`);
    }
    const res = escapeResult(
        `${!!currentScope.objects[<string>name ?? ""]}`,
    );

    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, objectExists);

export const $objectExists = objectExists.build();
