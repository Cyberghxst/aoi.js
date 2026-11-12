import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeFunctionResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const breakFunction = new AoiJSFunction()
    .setName("$break")
    .setType(FunctionType.Function)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns("void")
    .setDescription("Breaks out of a loop")
    .setExample(`
    
    $let[i;0]
    $while[$get[i] < 5 ;
        $if[$get[i] == 3; $break]
        $log[$get[i]]
        $inc[$get[i]]
    ]
    // Logs 0, 1, 2
    `);

breakFunction.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const res = escapeFunctionResult("break;");
    currentScope.rest = currentScope.rest.replace(data.total, res);
    scope[scope.length - 1] = currentScope;
    return {
        code: res,
        scope,
    };
}, breakFunction);

export const $break = breakFunction.build();
