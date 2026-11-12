import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const comment = new AoiJSFunction()
    .setName("$comment")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "comment",
            type: "string",
            description: "The comment to convert",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Void)
    .setDescription("Converts provided code to a comment")
    .setExample(`
        $comment[hello world] // returns /*hello world*/
    `);

comment.setCode((data: funcData, scope: Scope[], thisArg) => {
    const res = escapeResult("");
    return thisArg.finishResult(scope, data, res);
}, comment);

export const $comment = comment.build();
