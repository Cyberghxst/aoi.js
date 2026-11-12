/**
 * Minimal example bot (ESM flavour): same setup as tests/src/index.js, but
 * written with ES module syntax (this folder's package.json sets
 * "type": "module", so top-level await works). Creates an AoiClient from the
 * config in ./config.js and loads the command files in ./commands.
 * Needs a Discord bot token in a .env file (TOKEN=...). Run from the
 * repository root with `node tests/src-esm/index.js`.
 */
import { AoiClient } from "aoi.js";
import config from "./config.js";

const bot = new AoiClient( config.Client );

await bot.managers.commands.load({ path: "./commands" });
