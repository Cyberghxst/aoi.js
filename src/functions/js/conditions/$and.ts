import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { conditionLexer } from "../../../index.js";
import { escapeFunctionResult, parseResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const and = new AoiJSFunction()
    .setName("$and")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "condition",
            type: "string",
            description: "The condition to check",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("boolean")
    .setDescription("Returns true if all conditions are true ( function version of && )")
    .setExample(`
    $and[$isNumber[1];$isNumber[2]] // returns true 
    $and[$isNumber[1];$isNumber[hello]] // returns false
    `);

and.setCode((data, scope, thisArg) => {
    const conditions = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);

    const solved = conditionLexer( conditions.join( "&&" ) ).solve( );
    const res = escapeFunctionResult( parseResult(solved) );
    currentScope.update( res, data );
    return {
        code: res,
        scope,
        data,
    };
}, and);

export const $and = and.build();
