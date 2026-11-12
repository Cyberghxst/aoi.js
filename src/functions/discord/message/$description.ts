import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { RawEmbedData } from "zeneth";
import { parseString } from "../../../core/parsers/stringParser.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import { escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const description = new AoiJSFunction()
    .setName("$description")
    .setType(FunctionType.Setter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "index or description",
            type: "string | number",
            description: "The index of the embed to set the description of",
            required: true,
        },
        {
            name: "description",
            type: "string",
            description: "The description to set",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["text", ""])
    .setReturns("void")
    .setDescription("Sets the description of an embed at the specified index")
    .setExample(`
        $description[hello world] // sets the description of the first embed to "hello world"

        $description[2;hello world] // sets the description of the second embed to "hello world"
    `);

description.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    //code here
    const [indexOrDescription, ...description] = data.splits;
    const parsedDescription = description.join(";");
    let actualDescription: string;
    let index = 0;
    if (!parsedDescription) actualDescription = indexOrDescription;
    else if (parsedDescription && isNaN(Number(indexOrDescription)))
        actualDescription = indexOrDescription + ";" + parsedDescription;
    else {
        actualDescription = parsedDescription;
        index = Number(indexOrDescription) - 1;
    }

    let embed = currentScope.embeds[index] as RawEmbedData;
    if (!embed) {
        embed = {
            fields: [],
        };

        currentScope.setters += escapeResult(
            `${escapeVars(`${currentScope.name}_embeds`)}[${index}] = { fields: [] };`
        );
    }

    embed.description = actualDescription;
    currentScope.embeds[index] = embed;

    const res = escapeResult(
        `${escapeVars(`${currentScope.name}_embeds`)}[${index}].description = ${parseString(
            actualDescription,
        )};`,
    );

    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, description);

export const $description = description.build();
