import { EventEmitter } from "events";
import { AoiClient } from "./AoiClient.js";
import { Group } from "@akarui/structures";
import { Command } from "./Command.js";
import { Bundler, CommandOptions, TranspiledFuncData } from "../index.js";
import Path from "path";
import fs, { readFile } from "fs/promises";

/** Result of attempting to load a single custom event file, shown in the load report. */
interface CustomEventLoadResult {
    path: string;
    loaded: boolean;
    reason?: string;
}

/**
 * User-defined events. A custom event groups commands by the event name
 * they listen for (stored on the command as `listen`); calling `listen`
 * subscribes a handler that runs every matching command with the event
 * arguments whenever the event fires.
 */
export class CustomEvent extends EventEmitter {
    commands: Group<string, Command>;
    #client: AoiClient;
    constructor(client: AoiClient) {
        super();
        this.#client = client;
        this.commands = new Group<string, Command>(Infinity);
    }

    /**
     * Subscribes a handler for the given event name. Each time the
     * event fires, every registered command listening for it runs in
     * registration order with the event arguments.
     */
    listen(eventName: string) {
        this.on(eventName, async (...args) => {
            const matchingCommands = this.commands.filter((cmd) => cmd.listen === eventName);

            for (const cmd of matchingCommands.values()) {
                await cmd.__compiled__({ bot: this.#client, eventData: args } as unknown as TranspiledFuncData);
            }
        });
    }

    /** Registers one custom event command, keyed by its name. */
    add(command: CommandOptions) {
        const cmd = new Command(command, this.#client);
        this.commands.set(cmd.name, cmd);
    }

    /** Registers several custom event commands in order. */
    addMany(commands: CommandOptions[]) {
        for (const command of commands) this.add(command);
    }

    /**
     * Recursively loads custom event files from a directory and prints a
     * table of what loaded and what failed. A single bad file is
     * recorded in the report instead of aborting the whole load, so
     * one broken event cannot keep the rest from registering.
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
        const loadResults: CustomEventLoadResult[] = [];
        if (!usingAoi) {
            if (stats.isDirectory()) {
                const files = await fs.readdir(path);
                for (const file of files) {
                    const filePath = path + "/" + file;
                    const stats = await fs.stat(filePath);
                    if (stats.isDirectory())
                        await this.load({ path: filePath, usingAoi });
                    else if (stats.isFile() && file.endsWith(".js")) {
                        let command;
                        try {
                            if (process.platform === "win32") {
                                // On Windows a plain path import is rejected, so the file is imported through a file URL.
                                const fp = Path.join(
                                    "file:///",
                                    process.cwd(),
                                    filePath,
                                );
                                command = await import(fp);
                            } else {
                                command = await import(
                                    Path.join(process.cwd(), filePath)
                                );
                            }
                            if (Array.isArray(command.default)) {
                                this.addMany(command.default);
                            } else this.add(command.default);

                            loadResults.push({ path: <string>filePath.split("/").pop(), loaded: true });
                        } catch (e) {
                            // A failed file is reported, not thrown, so loading continues with the rest.
                            loadResults.push({ path: <string>filePath.split("/").pop(), loaded: false, reason: e as string });
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
                    else if (stats.isFile() && file.endsWith(".aoi")) {
                        const command = await readFile(filePath, "utf-8");
                        try {
                            const cmd = Bundler(command, this.#client).command;
                            cmd.__path__ = filePath;
                            this.add(cmd as unknown as CommandOptions);
                            loadResults.push({ path: <string>filePath.split("/").pop(), loaded: true });
                        } catch (e) {
                            // A failed file is reported, not thrown, so loading continues with the rest.
                            loadResults.push({ path: <string>filePath.split("/").pop(), loaded: false, reason: e as string });
                        }
                    }
                }
            }
        }
        const box = boxen(
            `${loadResults.map((cmd) => {
                return `∷ ${chalk.cyanBright(cmd.loaded ? "Loaded" : "Failed")} ${chalk.greenBright(
                    cmd.path,
                )} ${chalk.redBright(cmd.loaded ? "" : cmd.reason)}`;
            }).join("\n")}
        `,
            {
                title: `∴ Loading Events ( ${chalk.yellowBright(loadResults.length)} )`,
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
}
