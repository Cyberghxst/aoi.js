import { Guild, Snowflake, User } from "zeneth";
import { AoiClient } from "./AoiClient.js";
import { Group } from "@akarui/structures";

/**
 * Convenience lookups for users and guilds. Reads go through the
 * client's cache when one is configured, so a cached lookup never hits
 * the Discord API, and fall back to a live fetch otherwise.
 */
export class Util {
    client: AoiClient;
    constructor(client: AoiClient) {
        this.client = client;
    }

    /** Returns a user from the cache when available, or fetches them from Discord. */
    async getUser(id: Snowflake) {
        if (this.client.cache?.users) return this.client.cache.users.get(id);
        else return await this.client.client.getUser(id);
    }

    /** Finds a cached user by username or tag. Returns undefined when the user is not cached (no API call is made). */
    findUser(name: string) {
        if (this.client.cache?.users)
            return (<Group<Snowflake, User>>(
                (<unknown>this.client.cache.users)
            )).find((u) => u.username === name || u.tag === name);
        else return undefined;
    }

    /** Returns a guild from the cache when available, or fetches it from Discord. */
    async getGuild(id: Snowflake) {
        if (this.client.cache?.guilds) return this.client.cache.guilds.get(id) as Guild;
        else return await this.client.client.getGuild(id);
    }
}
