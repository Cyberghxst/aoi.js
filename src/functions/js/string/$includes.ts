import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, Scope, parseString } from "../../../index.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const includes = new AoiJSFunction()
    .setName("$includes")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "text",
            type: "string",
            description: "The text to check",
            required: true,
        },
        {
            name: "search",
            type: "string",
            description: "The text to search for",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Boolean)
    .setDescription("Checks if the text includes the search")
    .setExample(`
        $includes[Hello World;Hello] // returns true
        $includes[Hello World;hello] // returns false
    `);

includes.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [text, search] = data.splits;
    const parsedText = parseString(text);
    const parsedSearch = parseString(search);
    const res = escapeResult(`${parsedText}.includes(${parsedSearch})`);
    currentScope.rest = currentScope.rest.replace(data.total, res);
    return {
        code: res,
        scope: scope,
    };
}, includes);

export const $includes = includes.build();
