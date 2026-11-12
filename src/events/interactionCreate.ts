import {
    Channel,
    GatewayEventNames,
    Guild,
    Interaction,
    InteractionTypes,
    Snowflake,
} from "zeneth";
import { AoiClient } from "../structures/AoiClient.js";
import { isAutoFetchDataEnabled } from "../util/DapiHelper.js";
import { AoiClientEvents, AutoFetchDataType, CommandType } from "../typings/enums.js";

/** Subscribes the interaction handler to the gateway's InteractionCreate event. */
export function onInteraction(client: AoiClient) {
    client.client.on(
        GatewayEventNames.InteractionCreate,
        async (interaction) => {
            await interactionCreate(interaction, client);
        },
    );
}

/**
 * Runs the interaction command whose name matches the interaction.
 * The channel and guild are taken from the interaction when present,
 * then from the cache, then fetched live when auto-fetch is enabled
 * for that kind of data; otherwise a stub carrying only the id is
 * passed, so commands can still read the id without a fetch.
 * Errors from a command are swallowed when the command already handled
 * them (the `component` flag), and anything else is emitted as a client
 * error.
 */
export async function interactionCreate(
    interaction: Interaction,
    client: AoiClient,
) {
    const cmdName = getCommandName(interaction);
    if (!cmdName) return;
    await client.managers.commands
        .exec({
            type: CommandType.Interaction,
            data: {
                interaction,
                client: client.client,
                bot: client,
                message: interaction.message,
                channel:
                    interaction.channel ??
                    client.cache?.channels?.get(interaction.channelId) as Channel | undefined ??
                    (isAutoFetchDataEnabled(AutoFetchDataType.Channel, client)
                        ? await client.client.getChannel(
                              interaction.channelId as Snowflake,
                        )
                        : { id: interaction.channelId, fetched: false }),
                guild:
                    client.cache?.guilds?.get(interaction.guildId) as Guild | undefined ??
                    (isAutoFetchDataEnabled(AutoFetchDataType.Guild, client)
                        ? await client.client.getGuild(
                              interaction.guildId as Snowflake,
                        )
                        : { id: interaction.guildId, fetched: false }),
                author: interaction.user,
                member: interaction.member,
            },
            filter: (cmd) => cmd.name === cmdName,
        })

        .catch((e) => {
            if (e.component && !e.success) return;
            else client.emit(AoiClientEvents.Error, e);
        });
}

/**
 * The command name an interaction targets: the slash command name for
 * application commands and autocomplete, the custom id for message
 * components (buttons, modals, select menus). Anything else (for
 * example a modal submit, which is a different interaction type) has
 * no command name and is ignored.
 */
function getCommandName(interaction: Interaction) {
    switch (interaction.type) {
    case InteractionTypes.ApplicationCommand:
        return interaction.data.name;
    case InteractionTypes.MessageComponent:
        return interaction.customId as string;
    case InteractionTypes.ApplicationCommandAutocomplete:
        return interaction.data.name;
    default:
        return undefined;
    }
}
