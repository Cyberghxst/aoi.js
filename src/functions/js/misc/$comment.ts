import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

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
    .setReturns("void")
    .setDescription("Converts provided code to a comment")
    .setExample(`
        $comment[hello world] // returns /*hello world*/
    `);

comment.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const res = escapeResult("");
    currentScope.update( res, data );
    return {
        code: res,
        scope: scope,
        data: data,
    };
}, comment);

export const $comment = comment.build();
