# @akarui/aoi.js

A Extension for Aoi.js

## Uso

```ts
import { AoiClient } from 'aoi.js';
import { GatewayIntentBits } from 'discord.js';

const bot = new AoiClient({
	token: process.env.DISCORD_TOKEN,
	prefix: '!',
	intents:
		GatewayIntentBits.Guilds |
		GatewayIntentBits.GuildMessages |
		GatewayIntentBits.MessageContent,
	events: ['onMessageCreate', 'onReady'],
});

bot.command({
	name: 'ping',
	type: 'basic',
	code: 'Pong! $ping ms',
});

await bot.start();
```

Los comandos de tipo `interaction` son slash commands: se registran solos
al arrancar (globales, o en un servidor con `slashGuildId`) y responden por
`interaction.reply`.

```ts
bot.command({
	name: 'ping',
	type: 'interaction',
	description: 'Responde con el ping del bot',
	code: 'Pong! $ping ms',
});
```

Las opciones del slash se definen en `options` (con los tipos de
`ApplicationCommandOptionType` de discord.js) y se leen con
`$option[nombre]`, que devuelve el valor tipado o `""` si la opción no se
dio. `$args` devuelve los argumentos del comando (en un slash, los valores
de las opciones en orden): `$args` todos unidos, `$args[1]` el primero.
Ver el ejemplo en `examples/ping-bot/` (`/saludar`, `/suma`, `!eco`).

Los componentes (botones, modales y menús) usan comandos de tipo
`component`: el nombre del comando es el `customId` del componente y la
respuesta sale por `interaction.reply`, como en los slash. `$addButton`
añade un botón al mensaje (`$addButton[customId;etiqueta;estilo]`, estilos
1 primary, 2 secondary, 3 success, 4 danger; los botones se agrupan solos
en filas de hasta 5). `$interactionUpdate` (sin argumentos) hace que la
respuesta edite el mensaje original de la interacción en vez de enviar
uno nuevo: el contenido y los botones son los mismos del comando, solo
cambia el transporte. `$showModal[customId;título;inputId;etiqueta;estilo]`
muestra un formulario (estilo 1 corto o 2 párrafo) y `$textInputValue[id]`
lee el campo cuando el usuario lo envía. En un menú, los valores elegidos
llegan como `$args`. Ver el ejemplo en `examples/ping-bot/` (`/boton`,
`/formulario`).

El paquete exporta `AoiClient` (también como default), `Command`, `Macro`,
`Util`, `Transpiler`, `AoiReader`, los builders (`FunctionBuilder`,
`CustomFunction`, `Scope`, `Condition`, `TextBlock`, `StringObject`), los
managers, los eventos (`onMessageCreate`, `onReady`), todas las funciones
`$...` y los tipos/enums. El subpath `aoi.js/core` exporta lo del núcleo
(`Transpiler`, `AoiReader`, builders).

## Desarrollo

```bash
# desde la raíz del monorepo
pnpm install
npx ts-patch install
# compilar @aoijs/structures primero (lo necesita aoi.js)
npx tsc -p lib/structures/tsconfig.esm.json
npx tsc -p lib/structures/tsconfig.cjs.json

# desde lib/aoi.js
npm run build              # compila ESM + CJS + tipos
npm run example:ping:test  # prueba el cableado sin conectarse a Discord
npm run example:ping       # arranca el bot de ejemplo (necesita DISCORD_TOKEN)
```

Hay un bot de ejemplo en [examples/ping-bot](examples/ping-bot) que responde
`!ping`. Necesita el intent privilegiado **Message Content** activado en el
portal de desarrolladores de Discord.
