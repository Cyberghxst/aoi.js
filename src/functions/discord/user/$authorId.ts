import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const authorId = new AoiJSFunction()
    .setName("$authorId")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns("bigint")
    .setDescription("Returns the id of the author")
    .setExample("author id is `$authorId`");

authorId.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    const authorId = "__$DISCORD_DATA$__.author?.id";

    const res = escapeResult(`(${authorId})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, authorId);

export const $authorId = authorId.build();
