import { CommandOptions } from "../typings/interfaces.js";
import { AsyncFunction, CommandTypes } from "../typings/types.js";
import { ExecuteAt } from "../typings/enums.js";
import { Transpiler } from "../core/transpiler.js";
import { AoiClient } from "./AoiClient.js";
import { Snowflake } from "zeneth";

/**
 * A single registered command: its name, type, and code, plus the
 * compiled function the transpiler produces from that code.
 *
 * The code is either a plain function, used as-is, or aoi.js script
 * code, which is transpiled once at registration time so the command
 * can run without re-parsing on every event. Any extra fields on the
 * command options are copied onto the instance, so custom commands can
 * carry their own metadata (for example a `listen` event name).
 */
export class Command {
    name: string;
    type: CommandTypes;
    code: string | AsyncFunction;
    aliases?: string[];
    channel?: string | Snowflake;
    __path__: string;
    reverseRead?: boolean;
    executeAt?: ExecuteAt;
    __compiled__: AsyncFunction;
    [key: string]: unknown;
    constructor(data: CommandOptions, client: AoiClient) {
        this.name = data.name;
        this.type = data.type;
        this.code = data.code;
        this.aliases = data.aliases;
        this.__path__ = data.__path__;
        this.executeAt = data.executeAt ?? ExecuteAt.Both;
        this.reverseRead = data.reverseRead ?? false;

        for (const key in data) {
            if (
                ![
                    "name",
                    "type",
                    "code",
                    "aliases",
                    "__path__",
                    "executeAt",
                    "reverseRead",
                ].includes(key)
            )
                this[key] = data[key];
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (this.code instanceof Function) this.__compiled__ = this.code;
        else {
            let resolvedChannel: Snowflake | undefined | AsyncFunction;
            if (this.channel) {
                if (
                    typeof this.channel === "string" &&
                    this.channel.startsWith("$")
                ) {
                    // A $-expression is transpiled into a function that resolves the channel id at runtime.
                    resolvedChannel = Transpiler(this.channel, {
                        sendMessage: false,
                        minify: true,
                        customFunctions:
                            client.managers.functions.functions.toJSON(),
                        scopeData: {
                            name: "GLOBAL_CHANNEL",
                        },
                        client,
                    }).func;
                } else if (typeof this.channel === "string")
                    resolvedChannel = BigInt(this.channel);
                else resolvedChannel = this.channel;
            }
            const transpiled = Transpiler(this.code, {
                sendMessage: true,
                minify: true,
                reverse: this.reverseRead,
                customFunctions: client.managers.functions.functions.toJSON(),
                client,
                scopeData: {
                    functions:
                        typeof resolvedChannel === "function"
                            ? `${resolvedChannel.toString()}`
                            : undefined,
                    useChannel:
                        typeof resolvedChannel === "function" ? `${resolvedChannel.name}()` : resolvedChannel,
                },
            });

            this.__compiled__ = transpiled.func;
        }
    }
}
