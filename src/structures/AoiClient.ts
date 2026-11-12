import {
    Client,
    CreateApplicationCommandPayload,
    Snowflake,
    createCacheManager,
} from "zeneth";
import { AoiClientOptions, CommandOptions } from "../typings/interfaces.js";
import { CommandManager } from "../manager/Command.js";
import { onMessage } from "../events/messageCreate.js";
import { Util } from "./Util.js";
import { FunctionManager } from "../manager/Function.js";
import { AoiClientProps } from "../typings/types.js";
import { AoiClientEvents, CommandType } from "../typings/enums.js";
import { onInteraction } from "../events/interactionCreate.js";
import { onReady } from "../events/ready.js";
import { readFileSync } from "fs";

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface AoiClient extends AoiClientProps {
    client: Client;
}

/**
 * The main bot client. Wraps the underlying `zeneth` Discord client and
 * owns the command and function managers, the event bindings, the
 * optional cache, and the helper utilities. Command helpers such as
 * `command()` and `interactionCommand()` are attached dynamically in
 * `#bindCommands` (see `AoiClientProps` for their types).
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class AoiClient {
    constructor(options: AoiClientOptions) {
        this.client = new Client(options);
        this.managers = {
            commands: new CommandManager(this),
            functions: new FunctionManager(this),
        };
        this.options = options;
        if (options.caches)
            this.cache = createCacheManager(options.caches, this.client);

        this.#bindEvents();
        this.#bindCommands();
        this.util = new Util(this);
        this.__on__ = {};
    }

    /**
     * Creates a client from a `./config.aoi` JSON file in the working
     * directory, so a bot can start without passing options in code.
     */
    static create() {
        const file = "./config.aoi";
        const config = JSON.parse(readFileSync(file, "utf-8")) as AoiClientOptions;
        return new AoiClient(config);

    }

    /**
     * Subscribes the handlers for every event the user listed in
     * `options.events`. Events that were not requested stay silent,
     * so the bot only pays for what it uses.
     */
    #bindEvents() {
        for (const event of this.options.events)
            switch (event) {
            case "MessageCreate":
                onMessage(this);
                break;
            case "InteractionCreate":
                onInteraction(this);
                break;
            case "Ready":
                onReady(this);
                break;
            default:
                break;
            }
    }

    /**
     * Creates one registration helper per command type on this client
     * (`command`, `interactionCommand`, `readyCommand`, `debugCommand`,
     * `componentCommand`). Each helper tags the given commands with its
     * type and hands them to the command manager. The basic type is
     * exposed as `command` instead of `basicCommand`.
     */
    #bindCommands() {
        const cmdTypes = this.managers.commands.types as CommandType[];
        for (const type of cmdTypes) {
            const cmdType = `${type}Command` as const;
            const parsedType = cmdType === "basicCommand" ? "command" : cmdType;
            this[parsedType] = function (
                ...cmd: Omit<CommandOptions, "type">[]
            ) {
                const commands = cmd.map((command) => {
                    return {
                        ...command,
                        type,
                    };
                }) as CommandOptions[];
                this.managers.commands.addMany(commands);
            };
        }

        this.componentCommand = function (
            ...cmd: Omit<CommandOptions, "type">[]
        ) {
            const commands = cmd.map((command) => {
                return {
                    ...command,
                    type: CommandType.Component,
                };
            }) as CommandOptions[];
            this.managers.commands.addMany(commands);
        };
    }

    /** Calls every listener registered for an event with the given arguments. */
    emit(event: AoiClientEvents, ...args: unknown[]) {
        if (this.__on__[event]) {
            for (const func of this.__on__[event] ?? []) {
                func(...args);
            }
        }
    }

    /** Registers a listener for one of the client's own events. */
    on(event: AoiClientEvents, func: (...args: unknown[]) => void) {
        if (!this.__on__[event]) this.__on__[event] = [];
        this.__on__[event]?.push(func);
    }

    /**
     * Registers an application (slash) command, either globally or in
     * one guild. Pass `"global"` for a global command, or a guild id
     * for a guild-only command (which appears instantly, unlike global
     * commands that can take up to an hour to propagate).
     */
    createApplicationCommand(
        globalOrGuildId: "global" | Snowflake,
        data: CreateApplicationCommandPayload,
    ) {
        if (globalOrGuildId === "global") {
            return this.client.createGlobalApplicationCommand(data);
        }
        return this.client.createGuildApplicationCommand(globalOrGuildId, data);
    }

    /**
     * Returns the source of a registered component command with the
     * given data prepended, so a $function can invoke it at runtime by
     * name. Throws when no component with that name is registered.
     */
    returnComponent(name: string, dataString: string) {
        const component = this.managers.commands.component.get(name);
        if (!component) throw new Error(`Component ${name} not found`);
        const func = component.__compiled__.toString();
        return `
${dataString};
${func}
`;
    }
}

export { AoiClient };
