import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError,Scope } from "../../../core/index.js";

import { funcData } from "../../../typings/interfaces.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const env = new AoiJSFunction()
    .setName("$env")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "env",
            type: "string",
            description: "The env to get from the current scope",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("?string")
    .setDescription("returns the value of an scoped variable of the current scope")
    .setExample(`
    $try[
        $let[;1]
    ]
    $catch[
        $log[ 
            $env[catch_error]
        ]
    ]
`);

env.setCode((data: funcData, scope: Scope[], thisArg) => {
    const env = data.inside;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        !env &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: ENV Not Provided.`);
    }
    const mainenv = env?.split(".")[0];

    if (
        !currentScope.env.includes(<string>mainenv) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: ENV ${env} Not Found`);
    }
    const res = escapeResult(`${env}`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, env);

export const $env = env.build();
