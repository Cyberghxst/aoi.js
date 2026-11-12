import { AoiClient } from "../../index.js";
import { BundlerCustoms, FunctionType, TranspilerCustoms } from "../../typings/enums.js";
import { funcData } from "../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    parseResult,
    removeMultiLineComments,
    removeSetFunc,
} from "../../util/transpilerHelpers.js";
import fixMath from "../parsers/mathParser.js";
import { parseString } from "../parsers/stringParser.js";
import StringObject from "./StringObject.js";

/**
 * The execution context of one command (or one nested scope inside it).
 *
 * A scope accumulates everything a transpiled command needs to emit: the
 * message content to send, embeds/components/files/stickers, variables,
 * objects, generated helper functions, and the leftover code (`rest`) that
 * has not been consumed by a `$function` yet. `toString()` / `getFunction()`
 * assemble those pieces into the final JavaScript function.
 */
export default class Scope {
    name: string;
    parent: string | undefined;
    children: Scope[] = [];
    sendData: {
        content: string;
    };
    embeds: unknown[] = [];
    components: unknown[] = [];
    files: unknown[] = [];
    stickers: unknown[] = [];
    env: string[];
    ephemeral = false;
    variables: string[];
    setters: string;
    objects: Record<string, StringObject>;
    rest: string;
    hasSendData: boolean;
    sendFunction: string;
    functions: string;
    _funcList: string[] = [];
    addReturn: boolean;
    useChannel?: bigint | string;
    embededJS: string[] = [];
    packages = "";
    client: AoiClient;
    constructor(
        name: string,
        client: AoiClient,
        parent?: string,
        code?: string,
        addReturn?: boolean,
    ) {
        this.name = name;
        this.sendFunction = "await __$DISCORD_DATA$__.client.createMessage";
        this.parent = parent;
        this.hasSendData = false;
        this.sendData = {
            content: code?.replaceAll("`", TranspilerCustoms.SL) || " ",
        };
        this.variables = [];
        this.objects = {};
        this.env = [];
        this.setters = "";
        this.functions = "";
        this.rest = code?.replaceAll("`", TranspilerCustoms.SL) || "";
        this.addReturn = addReturn ?? false;
        this.client = client;
    }
    addVariables(scopeVars: string[]) {
        this.variables.push(...scopeVars);
    }
    addEmbeds(embeds: unknown[]) {
        this.embeds.push(...embeds);
    }
    addFunction(func: string) {
        this.functions += func + " \n";
    }
    replaceLast(str: string, replacer: string, replacedTo: string) {
        const index = str.lastIndexOf(replacer);
        if (index === -1) return str;
        return (
            str.substring(0, index) +
            replacedTo +
            str.substring(index + replacer.length)
        );
    }
    replace(str: string, replacer: string, replacedTo: string) {
        const index = str.indexOf(replacer);
        if (index === -1) return str;
        return (
            str.substring(0, index) +
            replacedTo +
            str.substring(index + replacer.length)
        );
    }
    addChild(child: string) {
        this.children.push(new Scope(child, this.client, this.name));
    }
    getChild(name: string) {
        return this.children.find((child) => child.name === name);
    }
    removeChild(name: string) {
        this.children = this.children.filter((child) => child.name !== name);
    }
    updateEmbedJs() {
        const embeds = [...this.embededJS.reverse()];
        for (const embed of embeds) {
            const previousRest = this.rest;
            this.rest = this.replaceLast(this.rest, BundlerCustoms.EJS, embed);
            if (this.rest === previousRest) {
                this.packages = this.embededJS.shift() + "\n" + this.packages;
            } else {
                this.embededJS.shift();
            }
        }
    }
    toString(sendMessage = true) {
        const sendPayload: Record<string, string> = { ...this.sendData };
        sendPayload.embeds = escapeResult(escapeVars(`${this.name}_embeds`));
        sendPayload.components = escapeResult(
            escapeVars(`${this.name}_components`),
        );
        sendPayload.files = escapeResult(escapeVars(`${this.name}_files`));
        sendPayload.stickers = escapeResult(escapeVars(`${this.name}_stickers`));
        sendPayload.content = sendPayload.content
            .replaceAll("\n", TranspilerCustoms.NL)
            .replaceAll(BundlerCustoms.EJS, "");
        if (
            sendPayload.content.replaceAll(TranspilerCustoms.NL, "").trim() !==
                "" ||
            this.embeds.length ||
            this.files.length ||
            this.stickers.length
        )
            this.hasSendData = true;
        else this.hasSendData = false;

        let parsedContent = parseString(
            sendPayload.content.replaceAll(TranspilerCustoms.NL, "\n").trim(),
        );
        parsedContent =
            parsedContent.trim().replaceAll(TranspilerCustoms.SL, "\\`") === ""
                ? " "
                : parsedContent.trim().replaceAll(TranspilerCustoms.SL, "\\`");

        if (sendPayload.content.trim() !== "") {
            this.rest = this.replaceLast(
                parseResult(removeMultiLineComments(this.rest.trim())),
                sendPayload.content.replaceAll(TranspilerCustoms.NL, "\n").trim(),
                "",
            );
        }
        parsedContent = parsedContent.replaceAll("\\n", TranspilerCustoms.NL);

        const messagePayload = `{
  content: ${fixMath(parsedContent.trim() === "``" ? "` `" : parsedContent)},
  embeds: ${escapeVars(`${this.name}_embeds`)},
  components: ${escapeVars(`${this.name}_components`)},
  files: ${escapeVars(`${this.name}_files`)},
  stickers: ${escapeVars(`${this.name}_stickers`)},
  flags: ${this.ephemeral ? 64 : 0},
    }`.replaceAll(TranspilerCustoms.NL, "\\\\n");

        return parseResult(
            `const ${escapeVars(`${this.name}_embeds`)} = [];\n` +
                `const ${escapeVars(`${this.name}_components`)} = [];\n` +
                `const ${escapeVars(`${this.name}_files`)} = [];\n` +
                `const ${escapeVars(`${this.name}_stickers`)} = [];\n` +
                `${this.packages}` +
                `${this.setters}\n\n${
                    this.functions
                }\n\n${this.rest.trim()}\n\n`.trim() +
                `\n${(() => {
                    if (this.hasSendData && sendMessage) {
                        return `${this.addReturn ? "return " : ""} await ${
                            this.useChannel
                                ? this.sendFunction +
                                  `(${parseString(
                                      typeof this.useChannel === "bigint"
                                          ? this.useChannel.toString() + "n"
                                          : this.useChannel.toString(),
                                  )},${messagePayload});`
                                : this.sendFunction +
                                  `(__$DISCORD_DATA$__.message.channelId,${messagePayload});`
                        }`;
                    } else {
                        return "";
                    }
                })()}`,
        ).replaceAll(TranspilerCustoms.SL, "\\`");
    }
    getFunction(sendMessage = true, execute = false) {
        const functionName = this.name === "global" ? "main" : this.name;
        return (
            `async function ${functionName}(__$DISCORD_DATA$__) {\n${this.toString(
                sendMessage,
            )}\n}` +
            (execute
                ? `\n${
                    this.addReturn ? "return " : ""
                }${functionName}(__$DISCORD_DATA$__);`
                : "")
        ).replaceAll(TranspilerCustoms.SL, "`");
    }
    editMessage(channel: string, message: string) {
        const sendPayload: Record<string, string> = { ...this.sendData };
        sendPayload.embeds = escapeResult(escapeVars(`${this.name}_embeds`));
        sendPayload.components = escapeResult(
            escapeVars(`${this.name}_components`),
        );
        sendPayload.files = escapeResult(escapeVars(`${this.name}_files`));
        sendPayload.content = sendPayload.content.replaceAll(
            "\n",
            TranspilerCustoms.NL,
        );
        if (
            sendPayload.content.replaceAll(TranspilerCustoms.NL, "").trim() !==
                "" ||
            this.embeds.length ||
            this.files.length ||
            this.stickers.length
        )
            this.hasSendData = true;
        else this.hasSendData = false;

        let parsedContent = parseString(
            sendPayload.content.replaceAll(TranspilerCustoms.NL, "\n").trim(),
        );
        parsedContent = parsedContent.trim() === "" ? " " : parsedContent.trim();

        this.rest = this.replaceLast(
            this.rest.trim(),
            this.sendData.content.trim(),
            "",
        );

        const messagePayload = `{
  content: ${parsedContent.replaceAll("\\n", TranspilerCustoms.NL)},
  embeds: ${escapeVars(`${this.name}_embeds`)},
  components: ${escapeVars(`${this.name}_components`)},
  files: ${escapeVars(`${this.name}_files`)},
  stickers: ${escapeVars(`${this.name}_stickers`)},
    }`.replaceAll(TranspilerCustoms.NL, "\\\\n");

        return parseResult(
            `async function ${
                this.name === "global" ? "main" : this.name
            }(__$DISCORD_DATA$__) {\n` +
                `const ${escapeVars(`${this.name}_embeds`)} = [];\n` +
                `const ${escapeVars(`${this.name}_components`)} = [];\n` +
                `const ${escapeVars(`${this.name}_files`)} = [];\n` +
                `const ${escapeVars(`${this.name}_stickers`)} = [];\n` +
                `${this.packages}` +
                `${this.setters}\n\n${
                    this.functions
                }\n\n${this.rest.trim()}\n\n`.trim() +
                `\n${(() => {
                    if (this.hasSendData) {
                        return `${
                            this.addReturn ? "return " : ""
                        } await ${`__$DISCORD_DATA$__.client.editMessage(${parseString(
                            channel,
                        )},${parseString(message)},${messagePayload}).catch(e => {
              throw e;
            });`}`;
                    } else {
                        return "";
                    }
                })()}` +
                "\n}",
        ).replaceAll(TranspilerCustoms.SL, "\\`");
    }
    update(generatedCode: string, functionData: funcData) {
        if (functionData.type === FunctionType.Function) {
            this.rest = this.rest.replace(
                functionData.total.replaceAll(TranspilerCustoms.FSEP, ";"),
                generatedCode.replaceAll("$", "$$$$"),
            );
        } else if (functionData.type === FunctionType.Setter) {
            this.setters += generatedCode + "\n";

            this.rest = this.rest.replace(
                removeSetFunc(functionData.total).replaceAll(
                    TranspilerCustoms.FSEP,
                    ";",
                ),
                "",
            );
        } else if (functionData.type === FunctionType.FunctionGetter) {
            this.rest = this.rest.replace(
                functionData.total.replaceAll(TranspilerCustoms.FSEP, ";"),
                generatedCode.replaceAll("$", "$$$$"),
            );
        } else if (functionData.type === FunctionType.Getter) {
            this.rest = this.rest.replace(
                functionData.total.replaceAll(TranspilerCustoms.FSEP, ";"),
                generatedCode.replaceAll("$", "$$$$"),
            );
            // this.rest = this.replaceLast(this.rest, functionData.total.replaceAll(TranspilerCustoms.FSEP, ";"),generatedCode.replaceAll("$", "$$$$"));
        } else if (functionData.type === FunctionType.Scope || functionData.type === FunctionType.ScopeGetter) {
            this.rest = this.rest.replace(
                functionData.total.replaceAll(TranspilerCustoms.FSEP, ";"),
                generatedCode.replaceAll("$", "$$$$"),
            );
            functionData.funcs = [];
        }
    }

    rawString() {
        const sendPayload: Record<string, string> = { ...this.sendData };
        sendPayload.embeds = escapeResult(escapeVars(`${this.name}_embeds`));
        sendPayload.components = escapeResult(
            escapeVars(`${this.name}_components`),
        );
        sendPayload.files = escapeResult(escapeVars(`${this.name}_files`));
        sendPayload.stickers = escapeResult(escapeVars(`${this.name}_stickers`));
        sendPayload.content = sendPayload.content.replaceAll(
            "\n",
            TranspilerCustoms.NL,
        );
        if (
            sendPayload.content.replaceAll(TranspilerCustoms.NL, "").trim() !==
                "" ||
            this.embeds.length ||
            this.files.length ||
            this.stickers.length
        )
            this.hasSendData = true;
        else this.hasSendData = false;

        return parseResult(`\n\n${this.rest.trim()}\n\n`.trim()).replaceAll(
            TranspilerCustoms.SL,
            "\\`",
        );
    }
}
