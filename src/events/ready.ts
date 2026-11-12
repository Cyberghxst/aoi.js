import { Camelize, GatewayEventNames, GatewayReadyData } from "zeneth";
import { AoiClient } from "../index.js";

/** Subscribes the ready handler to the gateway's Ready event. */
export function onReady(client: AoiClient) {
    client.client.on(GatewayEventNames.Ready, async (data) => {
        await ready(data, client);
    });
}

/**
 * Runs every registered ready command once the gateway session is
 * ready, passing the ready payload along. Ready commands have no
 * trigger to match on, so the filter accepts all of them.
 */
export async function ready(
    data: Camelize<GatewayReadyData>,
    client: AoiClient,
) {
    await client.managers.commands.exec({
        type: "ready",
        data: {
            client: client.client,
            bot: client,
            data,
        },
        filter: () => true,
    });
}
