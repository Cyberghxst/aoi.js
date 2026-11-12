import { Client, Cacher } from "zeneth";
import { CommandManager } from "../manager/Command.js";
import { FunctionManager } from "../manager/Function.js";
import { Util } from "../structures/Util.js";
import {
    AoiClientOptions,
    CommandOptions,
    Plugin,
    TranspiledFuncData,
} from "./interfaces.js";
import { AoiClientEvents } from "./enums.js";

/** Every kind of command the bot can register. */
export type CommandTypes =
    | "basic"
    | "interaction"
    | "ready"
    | "debug"
    | "component";
/** A compiled command: an async function that runs with the transpiled event data. */
export type AsyncFunction = (arg: TranspiledFuncData) => Promise<unknown>;

/** The kinds of Discord data the client may fetch automatically when they are missing from the cache. */
export type autoFetchDataTypes =
    | "guild"
    | "channel"
    | "emoji"
    | "member"
    | "role"
    | "user"
    | "all";

// Makes the listed keys optional while keeping the rest of the type as-is.
export type OptionalFor<T, K extends keyof T> = {
    [P in keyof T as P extends K ? P : never]?: T[P];
};

// Keeps every key except the listed ones, all still required.
export type OptionalExecept<T, K extends keyof T> = {
    [P in keyof T as P extends K ? never : P]: T[P];
};

/** Makes the listed keys optional and leaves the rest required. */
export type Optional<T, K extends keyof T> = OptionalFor<T, K> &
    OptionalExecept<T, K>;

// The basic type is exposed on the client as `command`, not
// `basicCommand`, so it is excluded from the generated helper names.
export type AoiClientProps = {
    command: (...cmd: Optional<CommandOptions, "type">[]) => void;
} & {
    [key in `${Exclude<CommandTypes, "basic">}Command`]: (
        ...cmd: Optional<CommandOptions, "type">[]
    ) => void;
} & {
    client: Client;
    managers: {
        commands: CommandManager;
        functions: FunctionManager;
    };
    options: AoiClientOptions;
    cache?: Cacher;
    util: Util;
    __on__: Partial<Record<AoiClientEvents, ((...args: unknown[]) => void)[]>>;
};

/** The stages at which a plugin can hook into the bot. */
export type PluginType =
    | "pre"
    | "post"
    | "load"
    | "preEvent"
    | "postEvent"
    | "preCommand"
    | "postCommand";

/** The plugin lists, one per stage. */
export type PluginManagerProps = {
    [key in PluginType]: Plugin[];
};
