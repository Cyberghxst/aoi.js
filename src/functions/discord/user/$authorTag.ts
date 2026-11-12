import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const authorTag = new AoiJSFunction()
    .setName("$authorTag")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns("string")
    .setDescription("Returns the tag of the author")
    .setExample("author tag is `$authorTag`");

authorTag.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    const authorTag = "__$DISCORD_DATA$__.author?.tag";

    const res = escapeResult(`(${authorTag})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, authorTag);

export const $authorTag = authorTag.build();
