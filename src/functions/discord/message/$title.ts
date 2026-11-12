import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { RawEmbedData } from "zeneth";
import { parseString } from "../../../core/parsers/stringParser.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const title = new AoiJSFunction()
    .setName("$title")
    .setType(FunctionType.Setter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "index or title",
            type: "string | number",
            description: "The index of the embed to set the title of",
            required: true,
        },
        {
            name: "title",
            type: "string",
            description: "The title to set",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["text", ""])
    .setReturns("void")
    .setDescription("Sets the title of an embed at the specified index")
    .setExample(`
        $title[hello world] // sets the title of the first embed to "hello world"

        $title[2;hello world] // sets the title of the second embed to "hello world"
    `);

title.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    //code here
    const [indexOrTitle, ...title] = data.splits;
    const parsedTitle = title.join(";");
    let actualTitle: string;
    let index = 0;
    if (!parsedTitle) actualTitle = indexOrTitle;
    else if (parsedTitle && isNaN(Number(indexOrTitle)))
        actualTitle = indexOrTitle + ";" + parsedTitle;
    else {
        actualTitle = parsedTitle;
        index = Number(indexOrTitle) - 1;
    }

    let embed = currentScope.embeds[index] as RawEmbedData;
    if (!embed) {
        embed = {
            fields: [],
        };

        currentScope.setters += escapeResult(
            `${escapeVars(
                `${currentScope.name}_embeds`,
            )}[${index}] = { fields: [] };`,
        );
    }

    embed.title = actualTitle;
    currentScope.embeds[index] = embed;

    const res = escapeResult(
        `${escapeVars(
            currentScope.name + "_embeds",
        )}[${index}].title = ${parseString(actualTitle)};`,
    );

    currentScope.update(res, data);

    return {
        code: res,
        scope,
    };
}, title);

export const $title = title.build();
