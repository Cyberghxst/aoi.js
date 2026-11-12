/* eslint-disable no-constant-condition */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Guild, Snowflake } from "zeneth";
import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { parseString } from "../../../index.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const guildName = new AoiJSFunction()
    .setName("$guildName")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "guildId",
            type: "number",
            description: "The guild id to get the name from",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["__$DISCORD_DATA$__.guild?.id"])
    .setReturns(ReturnType.String)
    .setDescription("Returns the name of current guild").setExample(`
        $guildName // returns the name of current guild

        $guildName[some id here] // returns the name of guild with provided id
        `);

guildName.setCode((data, scope, thisArg) => {
    const id = data.inside;
    const resultString = thisArg.conditionalGetResultString(
        !!id,
        {
            func: async (discord) =>
                (
                    (await discord.bot.util.getGuild(
                        "$0" as unknown as Snowflake,
                    )) as Guild
                )?.name,
            args: [parseString(id)],
        },
        {
            func: (discord) => discord.guild?.name,
            args: [],
        },
    );
    const res = escapeResult(resultString as string);
    return thisArg.finishResult(scope, data, res);
}, guildName);

export const $guildName = guildName.build();
