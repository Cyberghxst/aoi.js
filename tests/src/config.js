/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS example bot, so require() is the correct way to
// load aoi.js and dotenv (see generators/readme.js for the same exemption).

/**
 * Config for the example bot in ./index.js: the bot token comes from a .env
 * file (TOKEN=...), commands use the "!" prefix, and the client listens for
 * message and ready events with the default cache setup.
 */
const { Intents } = require("zeneth");
const { defaultCacheConfig } = require("aoi.js");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    Client: {
        token: process.env.TOKEN,
        prefixes: "!",
        intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
        events: ["MessageCreate","Ready"],
        caches: defaultCacheConfig(),
    },
};