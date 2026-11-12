import { AoiClient } from "../structures/AoiClient.js";
import { GatewayEventNames, Message, Snowflake } from "zeneth";
import { isAutoFetchDataEnabled } from "../util/DapiHelper.js";
import { AoiClientEvents } from "../typings/enums.js";

/** Subscribes the message handler to the gateway's MessageCreate event. */
export function onMessage(client: AoiClient) {
    client.client.on(GatewayEventNames.MessageCreate, async (message) => {
        await messageCreate(message, client);
    });
}

/**
 * Runs the basic command matching a message's prefix and first word
 * (or one of its aliases). Messages without a configured prefix, or
 * with a prefix but no command word, are ignored. The channel and
 * guild are taken from the cache when available, then fetched live
 * when auto-fetch is enabled for that kind of data; otherwise a stub
 * carrying only the id is passed, so commands can still read the id
 * without a fetch. Errors from a command are swallowed when the
 * command already handled them (the `component` flag), and anything
 * else is emitted as a client error.
 */
export async function messageCreate(message: Message, client: AoiClient) {
    let prefix: string | undefined;
    if (client.options.prefixes instanceof Array)
        prefix = client.options.prefixes.find((p) =>
            message.content.startsWith(p),
        );
    else prefix = client.options.prefixes;
    if (!prefix) return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;
    await client.managers.commands
        .exec({
            type: "basic",
            filter: (command) =>
                command.name === cmd || (command.aliases?.includes(cmd) ?? false),
            data: {
                message,
                channel:
                    client.cache?.channels?.get(message.channelId) ??
                    isAutoFetchDataEnabled("channel", client)
                        ? await client.client.getChannel(message.channelId)
                        : { id: message.channelId, fetched: false },
                guild:
                    client.cache?.guilds?.get(message.guildId) ??
                    isAutoFetchDataEnabled("guild", client)
                        ? await client.client.getGuild(
                              <Snowflake>message.guildId,
                        )
                        : { id: message.guildId, fetched: false },
                author: message.author,
                client: client.client,
                args,
                bot: client,
                member: message.member,
            },
        })

        .catch((e) => {
            if (e.component && !e.success) return;
            else client.emit(AoiClientEvents.Error, e);
        });
}
