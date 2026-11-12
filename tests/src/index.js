/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS example bot, so require() is the correct way to
// load aoi.js (see generators/readme.js for the same exemption).

/**
 * Minimal example bot (CommonJS flavour): creates an AoiClient from the
 * config in ./config.js and loads the command files in ./commands.
 * Needs a Discord bot token in a .env file (TOKEN=...). Run from the
 * repository root with `node tests/src/index.js`.
 */
const { AoiClient } = require("aoi.js");
const config = require("./config.js");

const bot = new AoiClient( config.Client );

(async () => {
    await bot.managers.commands.load({ path: "./commands" });
})();
