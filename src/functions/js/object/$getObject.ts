import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const getObject = new AoiJSFunction()
    .setName("$getObject")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to get",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("object")
    .setDescription("returns the object")
    .setExample(`
        $createObject[object;{key:value}]
        $getObject[object] // returns {key:value}
    `);

getObject.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside;
    if (
        !name &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.endsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No Object Name Provided`);
    }
    if (
        !currentScope.objects[<string>name ?? ""] &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.endsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name}: Invalid Object Name Provided`,
        );
    }
    if (
        !currentScope.packages.includes(
            "const UTIL = await import('util');",
        )
    ) {
        currentScope.packages += "const UTIL = await import('util');\n";
    }
    const res = escapeResult(
        `UTIL.inspect(${escapeVars(<string>name)},{depth:null})`,
    );

    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, getObject);

export const $getObject = getObject.build();
