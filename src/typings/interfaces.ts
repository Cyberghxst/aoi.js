import StringObject from "../core/structs/StringObject.js";
import {
    Channel,
    Client,
    ClientOptions,
    GatewayEventNames,
    GroupConfigOptions,
    Guild,
    Interaction,
    Message,
    Snowflake,
} from "zeneth";

/** Options passed to the transpiler when compiling aoi.js script code into JavaScript. */
export interface TranspilerOptions {
    customFunctions?: Record<string, FunctionData>;
    sendMessage: boolean;
    scopeData?: {
        variables?: string[];
        embeds?: unknown[];
        name?: string;
        sendFunction?: string;
        functions?: string;
        env?: string[];
        objects?: Record<string, StringObject>;
        embedJs?: string[];
        useChannel?: Snowflake | string;
    };
    reverse?: boolean;
    minify?: boolean;
    parsedStringOnly?: boolean;
    client: AoiClient;
    command?: Command;
}

import Scope from "../core/structs/Scope.js";
import {
    AsyncFunction,
    CommandTypes,
    autoFetchDataTypes,
} from "./types.js";
import { AoiClient } from "../index.js";
import { Command } from "../structures/Command.js";
import { ExecuteAt, FunctionType, PluginType } from "./enums.js";

/** The full definition of one $function, as produced by the `AoiJSFunction` builder. */
export interface FunctionData {
    name: string;
    brackets: boolean;
    optional: boolean;
    type: FunctionType;
    fields: {
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }[];
    returns: unknown;
    default: string[];
    description: string;
    version: string;
    example: string;
    extra?: unknown;
    code: (
        data: funcData,
        scope: Scope[],
    ) => { code: string; scope: Scope[]; data?: funcData };
}
/** A function definition together with the raw code it was parsed from. */
export interface PartialFunctionData extends FunctionData {
    total: string;
}
/** A function call found while parsing, with its arguments and position inside its parent call. */
export interface funcData extends FunctionData {
    inside?: string;
    parent?: FunctionData;
    total: string;
    splits: string[];
    funcs: funcData[];
    parsed: string;
}
/** Serialized form of a command, as stored or loaded from disk. */
export interface CommandData {
    name: string;
    type: CommandTypes;
    code: string;
    __compiled__?: string;
    __uglify__: boolean;
    aliases?: string[];
    __path__?: string;
}

/** A guild reshaped for display, with related objects reduced to ids and names. */
export interface TransformedGuild {
    rulesChannel: { id: string | null; name: string | undefined };
    publicUpdatesChannel: { id: string | null; name: string | undefined };
    bans: string;
    commands: number;
    partnered: boolean;
    verified: boolean;
    mfaLevel: unknown;
    explicitContentFilter: unknown;
    defaultMessageNotifications: unknown;
    systemChannelFlags: unknown;
    premiumTier: unknown;
    premiumSubscriptionCount: number | null;
    preferredLocale: unknown;
    systemChannel: { id: string | null; name: string | undefined };
    splash: string | null;
    owner: { id: string; name: string; nick: string | null };
    icon: string | null;
    afkChannel: { id: string | null; name: string | undefined };
    membersId: string[];
    channelsId: string[];
    rolesId: string[];
    emojisId: string[];
    stickersId: string[];
}

/** Options for creating an `AoiClient`, extending the underlying client's options. */
export interface AoiClientOptions extends ClientOptions {
    events: (keyof typeof GatewayEventNames)[];
    prefixes: string | string[];
    caches: Record<string, GroupConfigOptions>;
    autoFetchData?: autoFetchDataTypes[];
}

/** Options for registering one command. Extra fields are copied onto the `Command` instance. */
export interface CommandOptions {
    name: string;
    type: CommandTypes;
    code: string | AsyncFunction;
    aliases?: string[];
    reverseRead?: boolean;
    executeAt?: ExecuteAt;
    __path__: string;
    [key: string]: unknown;
}

/**
 * The data handed to a compiled command when it runs: the Discord
 * client and bot, the message/interaction that triggered it, the
 * resolved channel and guild (or a `{ id, fetched: false }` stub when
 * they could not be resolved), the author, the arguments, and the
 * command itself.
 */
export interface TranspiledFuncData {
    client: Client;
    bot: AoiClient;
    message?: Message;
    channel?: Channel | { id: Snowflake | undefined; fetched: boolean };
    guild?: Guild | { id: Snowflake | undefined; fetched: boolean };
    author?: Message["author"];
    args?: string[];
    member?: Message["member"];
    interaction?: Interaction;
    data?: unknown;
    command?: Command;
}

/** One plugin hook: a name and the function run for it. */
export interface Plugin {
    name: string;
    func: (...args: unknown[]) => unknown;
}

/** A group of plugins that all run at the same stage. */
export interface Plugins {
    type: PluginType;
    plugins: Plugin[];
}

/** The plugin groups a bot registers. */
export interface PluginOptions {
    plugins: Plugins[];
}
