import { Group } from "@akarui/structures";
import { Command } from "../structures/Command.js";
import { CommandOptions, TranspiledFuncData } from "../typings/interfaces.js";
import { CommandTypes, Optional } from "../typings/types.js";
import fs, { readFile } from "fs/promises";
import { AoiClient, Bundler } from "../index.js";
import Path from "path";

/** Result of attempting to load a single command file, shown in the load report. */
interface CommandLoadResult {
    path: string;
    loaded: boolean;
    reason?: string;
}

/**
 * Holds every registered command, grouped by type, and loads command
 * files from disk. Commands are stored in insertion order so they run
 * in the order they were registered.
 */
export class CommandManager {
    basic: Group<number, Command> = new Group<number, Command>(Infinity);
    interaction: Group<number, Command> = new Group<number, Command>(Infinity);
    ready: Group<number, Command> = new Group<number, Command>(Infinity);
    debug: Group<number, Command> = new Group<number, Command>(Infinity);
    component: Group<string, Command> = new Group<string, Command>(Infinity);
    #client: AoiClient;
    constructor(client: AoiClient) {
        this.#client = client;
    }

    /** Whether the given type has its own numbered group (component commands are keyed by name instead). */
    isValidType(type: string) {
        return ["basic", "interaction", "ready", "debug"].includes(type);
    }

    /** The numbered command groups, in the order their helpers are created on the client. */
    get types() {
        return ["basic", "interaction", "ready", "debug"];
    }

    /** Every command type, including the name-keyed component group. */
    static cmdTypes() {
        return ["basic", "interaction", "ready", "debug", "component"];
    }

    /**
     * Validates and registers one command. The path defaults to "root"
     * for commands created in code rather than loaded from a file.
     */
    add(command: Optional<CommandOptions, "__path__">) {
        if (!command.name) throw new Error("Command name is required");
        if (!command.type) throw new Error("Command type is required");
        if (!command.__path__) command.__path__ = "root";
        const cmd = new Command(command as CommandOptions, this.#client);
        if (this.isValidType(command.type) && command.type !== "component")
            this[command.type].set(this[command.type].size, cmd);
        else {
            if (command.type === "component")
                this.component.set(command.name, cmd);
            else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                throw new Error("Invalid command type provided", {
                    ...command,
                });
            }
        }
    }

    /** Registers several commands in order. */
    addMany(commands: Optional<CommandOptions, "__path__">[]) {
        for (const command of commands) this.add(command);
    }

    /**
     * Recursively loads command files from a directory and prints a
     * table of what loaded and what failed. A single bad file is
     * recorded in the report instead of aborting the whole load, so
     * one broken command cannot keep the rest from registering.
     *
     * @param path - Directory (or file) to load from.
     * @param usingAoi - When true, load `.aoi` script files through the
     * Bundler instead of importing `.js` modules.
     */
    async load({
        path,
        usingAoi = false,
    }: {
        path: string;
        usingAoi?: boolean;
    }) {
        const chalk = (await import("chalk")).default;
        const boxen = (await import("boxen")).default;
        const stats = await fs.stat(path);
        const loadResults: CommandLoadResult[] = [];
        if (!usingAoi) {
            if (stats.isDirectory()) {
                const files = await fs.readdir(path);
                for (const file of files) {
                    const filePath = path + "/" + file;
                    const stats = await fs.stat(filePath);
                    if (stats.isDirectory())
                        await this.load({ path: filePath, usingAoi });
                    else if (
                        stats.isFile() &&
                        file.endsWith(".js") &&
                        !file.endsWith(".template.js")
                    ) {
                        let command;
                        try {
                            command = await this.loadFile(filePath);
                            if (Array.isArray(command.default)) {
                                this.addMany(command.default);
                            } else this.add(command.default);

                            loadResults.push({
                                path: <string>filePath.split("/").pop(),
                                loaded: true,
                            });
                        } catch (e) {
                            // A failed file is reported, not thrown, so loading continues with the rest.
                            loadResults.push({
                                path: <string>filePath.split("/").pop(),
                                loaded: false,
                                reason: e as string,
                            });
                        }
                    }
                }
            }
        } else {
            if (stats.isDirectory()) {
                const files = await fs.readdir(path);
                for (const file of files) {
                    const filePath = path + "/" + file;
                    const stats = await fs.stat(filePath);
                    if (stats.isDirectory())
                        await this.load({ path: filePath, usingAoi });
                    else if (
                        stats.isFile() &&
                        file.endsWith(".aoi") &&
                        !file.endsWith(".template.aoi")
                    ) {
                        const command = await readFile(filePath, "utf-8");
                        try {
                            const cmd = Bundler(command, this.#client).command;
                            cmd.__path__ = filePath;
                            this.add(cmd as unknown as CommandOptions);
                            loadResults.push({
                                path: <string>filePath.split("/").pop(),
                                loaded: true,
                            });
                        } catch (e) {
                            // A failed file is reported, not thrown, so loading continues with the rest.
                            loadResults.push({
                                path: <string>filePath.split("/").pop(),
                                loaded: false,
                                reason: e as string,
                            });
                        }
                    }
                }
            }
        }
        const box = boxen(
            `${loadResults.map((cmd) => {
                return `∷ ${chalk.cyanBright(
                    cmd.loaded ? "Loaded" : "Failed",
                )} ${chalk.greenBright(cmd.path)} ${chalk.redBright(
                    cmd.loaded ? "" : cmd.reason,
                )}`;
            }).join("\n")}
        `,
            {
                title: `∴ Loading ${chalk.blueBright(
                    path,
                )} ( ${chalk.yellowBright(loadResults.length)} )`,
                borderStyle: "round",
                borderColor: "cyan",
                textAlignment: "left",
                backgroundColor: "black",
                width: 100,
                padding: 1,
                dimBorder: true,
                float: "center",
            },
        );

        console.log(box);
    }

    /**
     * Runs every command of the given type whose filter matches.
     * Commands run one after another, in registration order.
     */
    async exec({
        type,
        data,
        filter,
    }: {
        type: CommandTypes;
        data: TranspiledFuncData;
        filter: (cmd: Command) => boolean;
    }) {
        const matchingCommands = this[type].filter((cmd) => filter(cmd));
        if (matchingCommands.size) {
            for (const command of matchingCommands.values()) {
                await command.__compiled__({ ...data, command });
            }
        }
    }

    /**
     * Imports a command module. Falls back to a file URL import on
     * Windows, where a plain path import is rejected, and to an
     * absolute-path import elsewhere when `require` is unavailable.
     */
    async loadFile(filePath: string) {
        let command;
        try {
            command = require(filePath);
        } catch {
            if (process.platform === "win32") {
                const fp = Path.join("file:///", process.cwd(), filePath);
                command = await import(fp);
            } else {
                command = await import(Path.join(process.cwd(), filePath));
            }
        }

        return command;
    }
}
