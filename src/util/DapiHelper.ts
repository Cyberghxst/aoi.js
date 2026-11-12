import { Message } from "zeneth";
import { AoiClient } from "..";
import { AutoFetchDataType } from "../typings/enums.js";
import { autoFetchDataTypes } from "../typings/types.js";

/**
 * Checks if the autoFetchData is enabled for the given string
 * @param {autoFetchDataTypes} dataType The string to check
 * @param {AoiClient} client The client
 * @returns {boolean}
 * @example
 * ```js
 * isAutoFetchDataEnabled("messages", client)
 * ```
 */
export function isAutoFetchDataEnabled(
    dataType: autoFetchDataTypes,
    client: AoiClient,
) {
    if (!dataType) return false;
    return (
        client.options.autoFetchData?.includes(dataType) ||
        client.options.autoFetchData?.includes(AutoFetchDataType.All) ||
        false
    );
}

/**
 * Returns the default cache config
 * @example
 * ```js
 * defaultCacheConfig()
 * ```
 */
export function defaultCacheConfig(): {
    messages: {
        class: string;
        cacheFunction: (message: Message) => boolean;
    };
    channels: {
        class: string;
    };
    guilds: {
        class: string;
    };
    } {
    return {
        messages: {
            class: "Message",
            cacheFunction: (message: Message) => !message.author.bot,
        },
        channels: {
            class: "Channel",
        },
        guilds: {
            class: "Guild",
        },
    };
}
