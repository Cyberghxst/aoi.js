import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const authorName = new AoiJSFunction()
    .setName("$authorName")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns("string")
    .setDescription("Returns the name of the author")
    .setExample("author name is `$authorName`");

authorName.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    const authorName = "__$DISCORD_DATA$__.author?.username";

    const res = escapeResult(`(${authorName})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, authorName);

export const $authorName = authorName.build();
