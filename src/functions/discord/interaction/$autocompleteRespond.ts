/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InteractionResponseTypes, Snowflake } from "zeneth";
import { StringObject, parseStringObject } from "../../../index.js";
import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const autocomplete = new AoiJSFunction()
    .setName("$autocompleteRespond")
    .setType(FunctionType.Setter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "options",
            type: "array  | object",
            description: "The options to respond with",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Void)
    .setDescription(
        "responds to the autocomplete interaction with the provided options",
    ).setExample(`
        $autocompleteRespond[{
            name: "Hello World",
            value: "helloworld"
        };{
            name: "Hello World 2",
            value: "helloworld2"
        }] // responds to the autocomplete interaction with the provided options (object)

        $autocompleteRespond[Hello World;helloworld;Hello World 2;helloworld2] // responds to the autocomplete interaction with the provided options (array)
    `);

autocomplete.setCode((data, scope, thisArg) => {
    const opts = thisArg.getParams(data);
    const options = [];
    let i = 0;
    while (i < opts.length) {
        const opt = opts[i].trim();
        if (opt.startsWith("{") && opt.endsWith("}")) {
            const currentObj = new StringObject("{");
            currentObj.addEnd("}");

            const obj = parseStringObject(opt, currentObj);
            options.push(obj.solve());
            i += 1;
        } else {
            const name = opt;
            const value = opts[i + 1];
            options.push(`{name: "${name}", value: "${value}" }`);
            i += 2;
        }
    }

    const resultString = thisArg.getResultString(
        async (discord) =>
            await discord.client.createInteractionResponse(
                discord.interaction?.id as Snowflake,
                discord.interaction?.token as string,
                //@ts-ignore
                "$0",
                {
                    choices: ["$1"] as any,
                },
            ),
        [InteractionResponseTypes.ApplicationCommandAutocompleteResult, options.join(",\n")],
    );

    const res = escapeResult(resultString as string);
    return thisArg.finishResult(scope, data, res);
}, autocomplete);

export const $autocompleteRespond = autocomplete.build();
