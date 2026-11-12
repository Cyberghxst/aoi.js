/**
 * Public entry point for the aoi.js package.
 *
 * Re-exports the client, the command/function managers, the $function
 * builder, the event handlers, the shared types, and the helper utilities
 * so bot authors can import everything from a single place.
 */
import { AoiClient } from "./structures/AoiClient.js";
export * from "./core/index.js";
export * from "./typings/interfaces.js";
export * from "./typings/types.js";
export * from "./typings/enums.js";
import functions, { JSFuncs, DiscordFuncs } from "./functions/index.js";

export * from "./util/DapiHelper.js";
export * from "./util/Time.js";
export * from "./util/transpilerHelpers.js";

export * from "./manager/Command.js";
export * from "./manager/Function.js";

export * from "./events/index.js";

export * from "./structures/AoiJSFunction.js";
export * from "./structures/Command.js";
export * from "./structures/CustomEvent.js";
export * from "./structures/Util.js";

export { AoiClient, functions, JSFuncs, DiscordFuncs };
