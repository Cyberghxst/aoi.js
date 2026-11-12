/**
 * Config for the example bot in ./index.js: the bot token comes from a .env
 * file (TOKEN=...), commands use the "!" prefix, and the client listens for
 * message and ready events with the default cache setup.
 */
import { Intents } from "zeneth";
import { defaultCacheConfig } from "aoi.js";
import dotenv from "dotenv";

dotenv.config();

export default {
    Client: {
        token: process.env.TOKEN,
        prefixes: "!",
        intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
        events: ["MessageCreate","Ready"],
        caches: defaultCacheConfig(),
    },
};