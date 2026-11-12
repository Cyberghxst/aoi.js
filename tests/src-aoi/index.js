/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS example bot, so require() is the correct way to
// load aoi.js (see generators/readme.js for the same exemption).

/**
 * Minimal example bot (aoi-code flavour): same setup as tests/src/index.js,
 * but the commands in ./commands are written in aoi-code (.aoi files)
 * instead of JavaScript, so they are loaded with `usingAoi: true`.
 * Needs a Discord bot token in a .env file (TOKEN=...). Run from the
 * repository root with `node tests/src-aoi/index.js`.
 */
const { AoiClient } = require("aoi.js");
const config = require("./config.js");

const bot = new AoiClient( config.Client );

(async () => {
    await bot.managers.commands.load({ path: "./commands", usingAoi: true });
})();
