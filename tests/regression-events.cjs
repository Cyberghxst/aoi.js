/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the built library (see tests/index.js for the same exemption).

/**
 * Regression tests for the ??/ternary precedence bug in the event
 * handlers (src/events/interactionCreate.ts, src/events/messageCreate.ts).
 *
 * Before the fix, `a ?? b ?? isAutoFetch(...) ? await fetch() : fallback`
 * parsed as `(a ?? b ?? isAutoFetch(...)) ? await fetch() : fallback`,
 * so a cached channel/guild still triggered a live fetch. After the fix
 * the ternary is parenthesised, so the three cases behave as intended:
 *   1. cached value present  -> no live fetch, cached value is passed
 *   2. nothing cached + auto-fetch on  -> live fetch is called
 *   3. nothing cached + auto-fetch off -> { id, fetched: false } stub, no call
 *
 * Plain node, no test framework. Requires the built CJS output:
 *   REGRESSION_DIST=/tmp/dist-events node tests/regression-events.cjs
 * The build dir defaults to ../dist/cjs (relative to this file), i.e.
 * the repo's own CJS build. Build it without touching the shared dist/
 * with e.g.:
 *   npx tsc -p tsconfig.cjs.json --outDir /tmp/dist-events
 */
const assert = require("node:assert");
const path = require("node:path");

const dist =
    process.env.REGRESSION_DIST ||
    path.join(__dirname, "..", "dist", "cjs");
const { interactionCreate } = require(path.join(
    dist,
    "events",
    "interactionCreate.js",
));
const { messageCreate } = require(path.join(
    dist,
    "events",
    "messageCreate.js",
));
// InteractionTypes.ApplicationCommand, resolved from the real dependency
// so the fake interaction matches what the handler switches on.
const { InteractionTypes } = require("zeneth");

let failures = 0;

function check(name, fn) {
    try {
        fn();
        console.log(`ok   ${name}`);
    } catch (e) {
        failures++;
        console.log(`FAIL ${name}: ${e.message}`);
    }
}

/**
 * Fake AoiClient: a cache (Map-backed channels/guilds), a fake Discord
 * client whose getChannel/getGuild record every call, and a fake command
 * manager whose exec captures the `data` the handler passes.
 */
function makeClient({ cachedChannel, cachedGuild, autoFetch }) {
    const calls = { getChannel: [], getGuild: [], data: undefined };
    const channels = new Map();
    const guilds = new Map();
    if (cachedChannel) channels.set(cachedChannel.id, cachedChannel);
    if (cachedGuild) guilds.set(cachedGuild.id, cachedGuild);
    const client = {
        client: {
            getChannel: async (id) => {
                calls.getChannel.push(id);
                return { id, fetched: true, live: true };
            },
            getGuild: async (id) => {
                calls.getGuild.push(id);
                return { id, fetched: true, live: true };
            },
        },
        cache: { channels, guilds },
        options: { prefixes: ["!"], autoFetchData: autoFetch },
        managers: {
            commands: {
                exec: async ({ data }) => {
                    calls.data = data;
                },
            },
        },
        emit: () => {},
    };
    return { client, calls };
}

function fakeInteraction({ channel } = {}) {
    return {
        type: InteractionTypes.ApplicationCommand,
        data: { name: "ping" },
        channel,
        channelId: "chan1",
        guildId: "guild1",
        user: { id: "u1" },
        member: null,
        message: null,
    };
}

function fakeMessage() {
    return {
        content: "!ping",
        channelId: "chan1",
        guildId: "guild1",
        author: { id: "u1" },
        member: null,
    };
}

async function main() {
    // ---- interactionCreate: channel ----
    {
        const cached = { id: "chan1", cached: true };
        const { client, calls } = makeClient({
            cachedChannel: cached,
            cachedGuild: { id: "guild1", cached: true },
            autoFetch: [],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction channel: cache hit -> no getChannel call", () => {
            assert.deepStrictEqual(calls.getChannel, []);
        });
        check("interaction channel: cache hit -> cached value passed", () => {
            assert.strictEqual(calls.data.channel, cached);
        });
    }
    {
        // interaction.channel itself is the first source and beats the cache.
        const fromInteraction = { id: "chan1", fromInteraction: true };
        const { client, calls } = makeClient({
            cachedChannel: { id: "chan1", cached: true },
            cachedGuild: { id: "guild1", cached: true },
            autoFetch: [],
        });
        await interactionCreate(fakeInteraction({ channel: fromInteraction }), client);
        check("interaction channel: interaction.channel beats cache, no call", () => {
            assert.deepStrictEqual(calls.getChannel, []);
            assert.strictEqual(calls.data.channel, fromInteraction);
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["channel", "guild"],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction channel: cache miss + autofetch on -> getChannel called", () => {
            assert.deepStrictEqual(calls.getChannel, ["chan1"]);
        });
        check("interaction channel: cache miss + autofetch on -> fetched value passed", () => {
            assert.deepStrictEqual(calls.data.channel, {
                id: "chan1",
                fetched: true,
                live: true,
            });
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: [],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction channel: cache miss + autofetch off -> no getChannel call", () => {
            assert.deepStrictEqual(calls.getChannel, []);
        });
        check("interaction channel: cache miss + autofetch off -> fallback stub passed", () => {
            assert.deepStrictEqual(calls.data.channel, {
                id: "chan1",
                fetched: false,
            });
        });
    }

    // ---- interactionCreate: guild ----
    {
        const cached = { id: "guild1", cached: true };
        const { client, calls } = makeClient({
            cachedChannel: { id: "chan1", cached: true },
            cachedGuild: cached,
            autoFetch: [],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction guild: cache hit -> no getGuild call", () => {
            assert.deepStrictEqual(calls.getGuild, []);
        });
        check("interaction guild: cache hit -> cached value passed", () => {
            assert.strictEqual(calls.data.guild, cached);
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["channel", "guild"],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction guild: cache miss + autofetch on -> getGuild called", () => {
            assert.deepStrictEqual(calls.getGuild, ["guild1"]);
        });
        check("interaction guild: cache miss + autofetch on -> fetched value passed", () => {
            assert.deepStrictEqual(calls.data.guild, {
                id: "guild1",
                fetched: true,
                live: true,
            });
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: [],
        });
        await interactionCreate(fakeInteraction(), client);
        check("interaction guild: cache miss + autofetch off -> no getGuild call", () => {
            assert.deepStrictEqual(calls.getGuild, []);
        });
        check("interaction guild: cache miss + autofetch off -> fallback stub passed", () => {
            assert.deepStrictEqual(calls.data.guild, {
                id: "guild1",
                fetched: false,
            });
        });
    }

    // ---- messageCreate: channel ----
    {
        const cached = { id: "chan1", cached: true };
        const { client, calls } = makeClient({
            cachedChannel: cached,
            cachedGuild: { id: "guild1", cached: true },
            autoFetch: [],
        });
        await messageCreate(fakeMessage(), client);
        check("message channel: cache hit -> no getChannel call", () => {
            assert.deepStrictEqual(calls.getChannel, []);
        });
        check("message channel: cache hit -> cached value passed", () => {
            assert.strictEqual(calls.data.channel, cached);
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["channel", "guild"],
        });
        await messageCreate(fakeMessage(), client);
        check("message channel: cache miss + autofetch on -> getChannel called", () => {
            assert.deepStrictEqual(calls.getChannel, ["chan1"]);
        });
        check("message channel: cache miss + autofetch on -> fetched value passed", () => {
            assert.deepStrictEqual(calls.data.channel, {
                id: "chan1",
                fetched: true,
                live: true,
            });
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: [],
        });
        await messageCreate(fakeMessage(), client);
        check("message channel: cache miss + autofetch off -> no getChannel call", () => {
            assert.deepStrictEqual(calls.getChannel, []);
        });
        check("message channel: cache miss + autofetch off -> fallback stub passed", () => {
            assert.deepStrictEqual(calls.data.channel, {
                id: "chan1",
                fetched: false,
            });
        });
    }

    // ---- messageCreate: guild ----
    {
        const cached = { id: "guild1", cached: true };
        const { client, calls } = makeClient({
            cachedChannel: { id: "chan1", cached: true },
            cachedGuild: cached,
            autoFetch: [],
        });
        await messageCreate(fakeMessage(), client);
        check("message guild: cache hit -> no getGuild call", () => {
            assert.deepStrictEqual(calls.getGuild, []);
        });
        check("message guild: cache hit -> cached value passed", () => {
            assert.strictEqual(calls.data.guild, cached);
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["channel", "guild"],
        });
        await messageCreate(fakeMessage(), client);
        check("message guild: cache miss + autofetch on -> getGuild called", () => {
            assert.deepStrictEqual(calls.getGuild, ["guild1"]);
        });
        check("message guild: cache miss + autofetch on -> fetched value passed", () => {
            assert.deepStrictEqual(calls.data.guild, {
                id: "guild1",
                fetched: true,
                live: true,
            });
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: [],
        });
        await messageCreate(fakeMessage(), client);
        check("message guild: cache miss + autofetch off -> no getGuild call", () => {
            assert.deepStrictEqual(calls.getGuild, []);
        });
        check("message guild: cache miss + autofetch off -> fallback stub passed", () => {
            assert.deepStrictEqual(calls.data.guild, {
                id: "guild1",
                fetched: false,
            });
        });
    }

    // ---- auto-fetch is per data type, not all-or-nothing ----
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["channel"],
        });
        await interactionCreate(fakeInteraction(), client);
        check("autofetch ['channel'] only: channel fetched, guild stubbed", () => {
            assert.deepStrictEqual(calls.getChannel, ["chan1"]);
            assert.deepStrictEqual(calls.getGuild, []);
            assert.deepStrictEqual(calls.data.guild, {
                id: "guild1",
                fetched: false,
            });
        });
    }
    {
        const { client, calls } = makeClient({
            cachedChannel: undefined,
            cachedGuild: undefined,
            autoFetch: ["all"],
        });
        await messageCreate(fakeMessage(), client);
        check("autofetch ['all']: channel and guild both fetched", () => {
            assert.deepStrictEqual(calls.getChannel, ["chan1"]);
            assert.deepStrictEqual(calls.getGuild, ["guild1"]);
        });
    }

    console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error(e);
    process.exit(2);
});
