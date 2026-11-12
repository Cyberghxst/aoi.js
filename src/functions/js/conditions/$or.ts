import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { conditionLexer } from "../../../index.js";
import {
    escapeResult, parseResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const or = new AoiJSFunction()
    .setName("$or")
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
    .setReturns(ReturnType.Boolean)
    .setDescription("Returns true if any condition is true")
    .setExample(`
    $or[$isNumber[1];$isNumber[2]] // returns true
    $or[$isNumber[1];$isNumber[abc]] // returns true
    `);

or.setCode((data, scope, thisArg) => {
    const conditions = data.splits;
    const solved = conditionLexer(conditions.join("||")).solve();

    const res = escapeResult(parseResult(solved));
    return thisArg.finishResult(scope, data, res);
}, or);

export const $or = or.build();
