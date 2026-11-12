import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { conditionLexer } from "../../../index.js";
import {
    escapeResult, parseResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const checkCondition = new AoiJSFunction()
    .setName("$checkCondition")
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
    .setDescription("Returns true if the condition is true")
    .setExample(`
    $checkCondition[$isNumber[1]] // returns true

    $checkCondition[hello === world] // returns false
    `);

checkCondition.setCode((data, scope, thisArg) => {
    const conditions = <string>data.inside;
    const currentScope = thisArg.getCurrentScope(scope);
    const solved = conditionLexer(conditions).solve();
    const res = escapeResult(parseResult(solved));
    currentScope.update( res, data );

    return {
        code: res,
        scope,
    };
}, checkCondition);

export const $checkCondition = checkCondition.build();
