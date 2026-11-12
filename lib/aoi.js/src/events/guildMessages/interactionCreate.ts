/*
 Copyright 2024 Akarui Development

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

import { type Interaction, GuildMember, MessageFlags } from 'discord.js';
import type AoiClient from '@aoi.js/classes/AoiClient.js';
import { AoiClientEvents } from '@aoi.js/typings/enum.js';
import { safe } from '@aoi.js/utils/Helpers/core.js';

export async function _interactionCreate(
	interaction: Interaction,
	bot: AoiClient,
) {
	// Slash commands (/nombre).
	if (interaction.isChatInputCommand()) {
		await bot.managers.commands.exec({
			type: 'interaction',
			filter: (x) => x.name === interaction.commandName,
			data: {
				interaction,
				channel: interaction.channel ?? undefined,
				guild: interaction.guild ?? undefined,
				author: interaction.user,
				client: bot.client,
				// Los args de un slash son los valores de sus opciones, en el
				// orden en que se definieron, como texto: así $args y $args[1]
				// funcionan igual que en los comandos con prefijo. $option
				// lee el valor tipado directamente de la interacción.
				args: interaction.options.data.map((option) =>
					String(option.value ?? ''),
				),
				bot,
				// En interacciones el miembro puede venir como objeto parcial
				// de la API, sin los métodos de GuildMember: solo se pasa si
				// es un GuildMember completo.
				member:
					interaction.member instanceof GuildMember
						? interaction.member
						: undefined,
			},
		});
		return;
	}

	// Componentes (botones, envíos de modal y menús): se despachan a un
	// comando de tipo 'component' cuyo nombre es el customId. El
	// autocompletado se ignora en esta v1.
	if (
		interaction.isButton() ||
		interaction.isModalSubmit() ||
		interaction.isAnySelectMenu()
	) {
		await bot.managers.commands.exec({
			type: 'component',
			filter: (x) => x.name === interaction.customId,
			data: {
				interaction,
				channel: interaction.channel ?? undefined,
				guild: interaction.guild ?? undefined,
				author: interaction.user,
				client: bot.client,
				// En un menú, los valores elegidos son los args: así
				// $args[1] da el primer valor elegido.
				args: interaction.isAnySelectMenu()
					? [...interaction.values]
					: [],
				bot,
				member:
					interaction.member instanceof GuildMember
						? interaction.member
						: undefined,
			},
		});
	}
}

export default function onInteractionCreate(bot: AoiClient) {
	bot.client.on('interactionCreate', async (interaction) => {
		const res = await safe(_interactionCreate(interaction, bot));

		if (!res.success) {
			bot.client.emit(
				AoiClientEvents.Error,
				`An error occurred while executing the interaction event: ${res.error as string}`,
			);

			// Mejor esfuerzo: avisar al usuario en vez de dejar el
			// "interaction failed" de Discord sin explicación. Vale para
			// slash, botones, modales y menús (todos se pueden responder).
			try {
				if (
					interaction.isRepliable() &&
					!interaction.replied &&
					!interaction.deferred
				) {
					await interaction.reply({
						content: 'Ocurrió un error al ejecutar el comando.',
						flags: MessageFlags.Ephemeral,
					});
				}
			} catch {
				/* La interacción ya caducó o ya se respondió: nada que hacer. */
			}
		}
	});
}
