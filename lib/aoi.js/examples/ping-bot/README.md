# Bot de ejemplo: !ping, /ping, /saludar, /suma y !eco

Un bot mínimo de aoi.js v7 que responde `!ping` y `/ping` con el ping del bot,
`/saludar` y `/suma` con opciones, y `!eco` repitiendo los argumentos.

## Requisitos

- Node >= 20
- Un bot creado en https://discord.com/developers/applications, con el
  intent privilegiado **Message Content** activado en la pestaña Bot
  (sin él, el bot no ve el contenido de los mensajes y `!ping` no responde).
- El paquete compilado (una sola vez, desde `lib/aoi.js`):

```bash
npm run build
```

## Arrancar el bot

```bash
DISCORD_TOKEN=tu_token node examples/ping-bot/index.mjs
# o:
npm run example:ping
```

En tu servidor escribe `!ping` o usa `/ping`. El bot responde `Pong! <ping> ms`.

## Opciones de slash: $option y $args

`/saludar` tiene una opción de texto y la lee con `$option[nombre]`:

```js
bot.command({
	name: 'saludar',
	type: 'interaction',
	description: 'Saluda a alguien por su nombre',
	options: [
		{
			name: 'nombre',
			description: 'A quién saludar',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	code: 'Hola, $option[nombre]!',
});
```

`/suma` tiene dos opciones numéricas y las suma con `$sum`, anidando
`$option` dentro:

```js
bot.command({
	name: 'suma',
	type: 'interaction',
	description: 'Suma dos números',
	options: [
		{
			name: 'a',
			description: 'Primer número',
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
		{
			name: 'b',
			description: 'Segundo número',
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
	],
	code: '$option[a] + $option[b] = $sum[$option[a];$option[b]]',
});
```

`$option[nombre]` devuelve el valor tipado de la opción: texto, número o
booleano. Si la opción no se dio (opcional) o el comando no es una
interacción, devuelve `""`. Las opciones de usuario, canal o rol devuelven
su ID. Todavía no hay subcomandos ni grupos: `$option` solo lee opciones
de primer nivel.

`$args` devuelve los argumentos del comando: todos unidos por un espacio,
o uno solo con su índice **1-based** (como en aoi.js v6 y BDFD).
En un slash, los argumentos son los valores de las opciones, en el orden
en que se definieron. En un comando con prefijo, las palabras tras el
comando:

```js
// !eco hola mundo -> hola mundo
bot.command({ name: 'eco', type: 'basic', code: '$args' });

// $args[1] es el primer argumento, $args[2] el segundo.
// Sin argumentos (o fuera de rango) devuelve "".
```

Limitación resuelta: un comando que es solo una función (`$args`, `$message`...)
siempre se considera que "tiene contenido" en compilación, pero
`Scope.generate` tiene una guarda en ejecución: si el contenido queda
vacío y no hay embeds, componentes, archivos ni stickers, no se llama al
envío. Así `!eco` sin argumentos no envía nada en vez de un mensaje vacío
que Discord rechazaría.

## Slash commands

El comando `/ping` es de tipo `interaction`:

```js
bot.command({
	name: 'ping',
	type: 'interaction',
	description: 'Responde con el ping del bot',
	code: 'Pong! $ping ms',
});
```

Al arrancar, el bot registra solo los comandos `interaction` en Discord.
Con `GUILD_ID` se registran en ese servidor y aparecen al instante; sin él
se registran globales y pueden tardar hasta 1 hora en aparecer en Discord.

```bash
DISCORD_TOKEN=tu_token GUILD_ID=tu_servidor node examples/ping-bot/index.mjs
```

El nombre del slash debe ser minúsculas, 1-32 caracteres, solo letras,
números, `_` o `-`. El código del comando debe producir un mensaje: la
respuesta sale por `interaction.reply`, y si el comando no produce nada,
Discord muestra "interaction failed" al usuario.

## Botones y modales (componentes)

Un botón se añade al mensaje con `$addButton[customId;etiqueta;estilo]`:

```js
bot.command({
	name: 'boton',
	type: 'interaction',
	description: 'Envía un mensaje con dos botones',
	code: 'Pulsa un botón $addButton[saludo_btn;¡Salúdame!;1] $addButton[no_btn;No, gracias;2]',
});
```

El clic llega a un comando de tipo `component` cuyo nombre es el
`customId` del botón. Con `$interactionUpdate` (sin argumentos) la
respuesta edita el mensaje original en vez de enviar uno nuevo:

```js
bot.command({
	name: 'saludo_btn',
	type: 'component',
	code: '¡Hola! Has pulsado el botón. $interactionUpdate',
});
```

El contenido y los botones son los mismos del comando: solo cambia el
transporte (de `interaction.reply` a `interaction.update`). Sin
`$interactionUpdate`, el clic responde con un mensaje nuevo. Da igual
dónde se escriba en el código: el cambio afecta a la respuesta del
comando entero. Solo tiene sentido en comandos de componente (botones y
menús); sin interacción no hace nada.

Los botones se agrupan solos en filas de hasta 5. El estilo es
1 (primary), 2 (secondary), 3 (success) o 4 (danger); también acepta los
nombres en inglés (`primary`, `secondary`, `success`, `danger`). Opcional:
un cuarto parámetro `true`/`false` para deshabilitarlo y un quinto con un
emoji (unicode o `<:nombre:id>`).

Un modal (formulario) se muestra con `$showModal`:

```js
bot.command({
	name: 'formulario',
	type: 'interaction',
	description: 'Abre un formulario',
	code: '$showModal[form;Cuéntame algo;nombre;Tu nombre;1;Escribe tu nombre]',
});
```

El envío del modal llega a un comando de tipo `component` cuyo nombre es
el `customId` del modal, y `$textInputValue[id]` lee el campo:

```js
bot.command({
	name: 'form',
	type: 'component',
	code: 'Me has dicho: $textInputValue[nombre]',
});
```

El estilo del campo es 1 (corto) o 2 (párrafo); el placeholder y el
`required` son opcionales. Un comando que muestra un modal debe hacer solo
eso: el modal es la respuesta a la interacción.

Los menús (select menus) también llegan a comandos `component` por su
`customId`, y los valores elegidos llegan como `$args` (`$args[1]` es el
primero). Todavía no hay una función `$addSelectMenu` para enviarlos.

## Probar el cableado sin Discord

Sin token real, esta prueba construye el bot con un token falso y emite
eventos falsos por el camino real:

- `messageCreate` -> prefijo -> comando -> `channel.send`
- `interactionCreate` -> `/ping` -> comando -> `interaction.reply`
- `ready` -> registro de slash commands + comando `ready`

```bash
npm run example:ping:test
```

Comprueba que `!ping` y `/ping` responden, que los comandos desconocidos,
los mensajes sin prefijo y las interacciones que no son slash no hacen nada,
que `/ping`, `/saludar`, `/suma` y `/ecoargs` se registran con sus opciones,
que `/saludar nombre:Jeff` responde `Hola, Jeff!`, que `/suma a:2 b:3`
responde `2 + 3 = 5`, que `$args` funciona en slash (`/ecoargs`) y con
prefijo (`!eco hola mundo` -> `hola mundo`), y que el comando `ready` se ejecuta.
