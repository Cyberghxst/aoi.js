import * as Transpiler from "./transpiler.js";
import { JsonXYaml } from "./structs/JsonXYaml.js";
import { BundlerCustoms } from "../typings/enums.js";
import { AoiClient } from "../index.js";

/**
 * Loads a command from `.aoi` file contents: extracts embedded JS, parses
 * the exported command definition, and transpiles its code into an
 * executable function.
 */
export function Bundler(code: string, client: AoiClient) {
    const embedJs = parseEmbedJs(code);
    for (const embeddedJs of embedJs) {
        code = code.replace(`\${${embeddedJs}}`, BundlerCustoms.EJS);
    }
    const command = parseExportCommand(code);

    command.code = Transpiler.Transpiler(<string>command.code, {
        scopeData: {
            embedJs: embedJs,
        },
        sendMessage: true,
        minify: true,
        reverse: <boolean>command.reverse ?? false,
        client,
    }).func;

    return {
        command: command,
        embedJs,
    };
}

/**
 * Extracts raw JS from `${...}` (including nested `${...}`) blocks in a
 * string and returns each block's contents, so the JS can be transpiled
 * separately and spliced back in as an embed placeholder.
 */
export function parseEmbedJs(fileData: string) {
    let counter = 0;
    let isPotentialStart = false;
    let buffer = "";
    const embedJs: string[] = [];
    for (let i = 0; i < fileData.length; i++) {
        const char = fileData[i];
        if (char === "$") {
            if (counter) {
                buffer += char;
            }
            if (!isPotentialStart) {
                isPotentialStart = true;
            }
        } else if (char === "{") {
            if (isPotentialStart && !counter) {
                counter++;
            } else if (counter) {
                buffer += char;
                counter++;
            }
        } else if (char === "}") {
            if (counter) {
                counter--;
                if (counter === 0) {
                    embedJs.push(buffer);
                    buffer = "";
                    isPotentialStart = false;
                } else {
                    buffer += char;
                }
            } else if (isPotentialStart) {
                isPotentialStart = false;
            }
        } else {
            if (counter) {
                buffer += char;
            }
        }
    }
    if (counter) {
        throw new Error("Invalid embed js");
    }

    return embedJs;
}

/**
 * Extracts the code block of a `@{...}` string literal.
 */
export function getCodeFromString(command: string) {
    return command.split("@{").slice(1).join("@{").split("}").slice(0, -1).join("}").trim();
}

/**
 * Parses an `[exportCommand: <type>]` block into a command object.
 *
 * Braces inside the code block are masked before parsing so the
 * key/value parser does not mistake code braces for object structure,
 * then restored afterwards.
 */
export function parseExportCommand(commandSource: string) {
    const commandTypeMatchArray = commandSource.match(/\[exportCommand:\s*(\w+)\]/);
    if (!commandTypeMatchArray) {
        throw new Error("Invalid export command");
    }
    const commandType = commandTypeMatchArray[1];
    let command = commandSource.split(commandTypeMatchArray[0])[1].trim();
    command = command.slice(1, command.length - 1);

    const code = getCodeFromString(command);
    command = command.replace(code, code.replaceAll("{", BundlerCustoms.LB).replaceAll("}", BundlerCustoms.RB));
    const jsonxyaml = new JsonXYaml(command);
    const obj = jsonxyaml.toObject();
    obj.type = commandType;
    obj.code = (<string>obj.code).replaceAll(BundlerCustoms.LB, "{").replaceAll(BundlerCustoms.RB, "}");
    return obj;
}
