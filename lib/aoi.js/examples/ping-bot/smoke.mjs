// Prueba del cableado sin conectarse a Discord (no necesita token real):
// construye el bot con un token falso, registra !ping, /ping, /saludar,
// /suma, !eco, /boton y /formulario, y emite eventos falsos por el camino
// real:
//   messageCreate -> prefijo -> exec -> channel.send
//   interactionCreate -> /ping -> exec -> interaction.reply
//   interactionCreate -> botón -> exec (component) -> interaction.reply
//   interactionCreate -> modal -> exec (component) -> interaction.reply
//   ready -> registro de slash commands + comando ready
//
//   npm run example:ping:test
import { AoiClient } from 'aoi.js';
import { ApplicationCommandOptionType, GatewayIntentBits } from 'discord.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const enviados = [];
const canalFalso = {
	send: async (payload) => {
		enviados.push(payload);
	},
};

const respuestas = [];
const actualizaciones = [];
const modales = [];
const registrados = [];
// La aplicación real solo existe tras el login; aquí una falsa que
// captura lo que se registraría en Discord.
const aplicacionFalsa = {
	commands: {
		set: async (commands, guildId) => {
			registrados.push({ commands, guildId });
			return [];
		},
	},
};

const logs = [];
const logOriginal = console.log;
console.log = (...args) => {
	logs.push(args.join(' '));
};

const fallos = [];
const ok = (cond, mensaje) => {
	if (!cond) fallos.push(mensaje);
};

const bot = new AoiClient({
	token: 'x.y.z',
	prefix: '!',
	intents:
		GatewayIntentBits.Guilds |
		GatewayIntentBits.GuildMessages |
		GatewayIntentBits.MessageContent,
	events: ['onMessageCreate', 'onReady', 'onInteractionCreate'],
});
bot.client.application = aplicacionFalsa;

bot.command({
	name: 'ping',
	type: 'basic',
	code: 'Pong! $ping ms',
});

bot.command({
	name: 'ping',
	type: 'interaction',
	description: 'Responde con el ping del bot',
	code: 'Pong! $ping ms',
});

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

bot.command({
	name: 'eco',
	type: 'basic',
	code: '$args',
});

// /boton envía un mensaje con dos botones (con $addButton).
bot.command({
	name: 'boton',
	type: 'interaction',
	description: 'Envía un mensaje con dos botones',
	code: 'Pulsa un botón $addButton[saludo_btn;¡Salúdame!;1] $addButton[no_btn;No, gracias;2]',
});

// El clic en "¡Salúdame!" llega a un comando de tipo 'component' cuyo
// nombre es el customId del botón. $interactionUpdate hace que la
// respuesta edite el mensaje original en vez de enviar uno nuevo.
bot.command({
	name: 'saludo_btn',
	type: 'component',
	code: '¡Hola! Has pulsado el botón. $interactionUpdate',
});

// El clic en "No, gracias" también edita el mensaje original.
bot.command({
	name: 'no_btn',
	type: 'component',
	code: 'Vale, no pasa nada. $interactionUpdate',
});

// /formulario abre un modal (un formulario) con $showModal.
bot.command({
	name: 'formulario',
	type: 'interaction',
	description: 'Abre un formulario',
	code: '$showModal[form;Cuéntame algo;nombre;Tu nombre;1;Escribe tu nombre]',
});

// El envío del modal llega a un comando de tipo 'component' cuyo nombre
// es el customId del modal. $textInputValue lee el campo por su id.
bot.command({
	name: 'form',
	type: 'component',
	code: 'Me has dicho: $textInputValue[nombre]',
});

// Solo para la prueba: un menú. Los valores elegidos llegan como $args.
bot.command({
	name: 'elegir',
	type: 'component',
	code: 'Elegiste: $args[1]',
});

// Solo para la prueba: verifica que $args también funciona en slash,
// con los valores de las opciones como argumentos.
bot.command({
	name: 'ecoargs',
	type: 'interaction',
	description: 'Repite el primer argumento',
	options: [
		{
			name: 'texto',
			description: 'Texto a repetir',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	code: '$args[1] de $args',
});

bot.command({
	name: 'ready',
	type: 'ready',
	code: '$log[Bot listo! Escribe !ping en tu servidor.]',
});

const mensajeFalso = (content) => ({
	content,
	channel: canalFalso,
	guild: null,
	author: { id: '1', username: 'Jeff' },
	member: null,
});

const opcionesFalsas = (valores) => ({
	data: Object.entries(valores).map(([name, value]) => ({ name, value })),
	get: (name) => (name in valores ? { value: valores[name] } : null),
});

const interaccionFalsa = (commandName, esChatInput = true, valores = {}) => ({
	isChatInputCommand: () => esChatInput,
	isButton: () => false,
	isModalSubmit: () => false,
	isAnySelectMenu: () => false,
	isRepliable: () => true,
	commandName,
	reply: async (payload) => {
		respuestas.push(payload);
	},
	showModal: async (modal) => {
		modales.push(modal);
	},
	channel: canalFalso,
	guild: null,
	user: { id: '1', username: 'Jeff' },
	member: null,
	options: opcionesFalsas(valores),
	replied: false,
	deferred: false,
});

const componenteFalso = ({
	esBoton = false,
	esModal = false,
	esMenu = false,
	customId,
	valores = {},
}) => ({
	isChatInputCommand: () => false,
	isButton: () => esBoton,
	isModalSubmit: () => esModal,
	isAnySelectMenu: () => esMenu,
	isRepliable: () => true,
	customId,
	values: Object.values(valores),
	reply: async (payload) => {
		respuestas.push(payload);
	},
	update: async (payload) => {
		actualizaciones.push(payload);
	},
	fields: {
		getTextInputValue: (id) => valores[id] ?? '',
	},
	channel: canalFalso,
	guild: null,
	user: { id: '1', username: 'Jeff' },
	member: null,
	replied: false,
	deferred: false,
});

// 1. !ping responde por el camino real del evento messageCreate.
bot.client.emit('messageCreate', mensajeFalso('!ping'));
await sleep(200);
ok(
	enviados.length === 1,
	`!ping debería enviar 1 mensaje, envió ${enviados.length}`,
);
ok(
	/^Pong! (NaN|-?\d+) ms$/.test(enviados[0]?.content ?? ''),
	`!ping debería responder "Pong! <n> ms", respondió: ${JSON.stringify(enviados[0]?.content)}`,
);
// Nota: sin conexión, discord.js devuelve NaN en client.ws.ping
// (es el promedio de los shards, y no hay ninguno conectado).
// Con el bot logueado, el valor es un número real.

// 2. Un comando desconocido no envía nada.
bot.client.emit('messageCreate', mensajeFalso('!nope'));
await sleep(200);
ok(
	enviados.length === 1,
	`!nope no debería enviar nada, hay ${enviados.length} mensajes`,
);

// 3. Un mensaje sin prefijo no envía nada.
bot.client.emit('messageCreate', mensajeFalso('hola'));
await sleep(200);
ok(
	enviados.length === 1,
	`un mensaje sin prefijo no debería enviar nada, hay ${enviados.length} mensajes`,
);

// 4. El evento ready registra los slash commands y ejecuta el comando ready.
bot.client.emit('ready');
await sleep(200);
ok(
	registrados.length === 1,
	`ready debería registrar los slash 1 vez, lo hizo ${registrados.length}`,
);
ok(
	JSON.stringify(registrados[0]?.commands) ===
		JSON.stringify([
			{
				name: 'ping',
				description: 'Responde con el ping del bot',
				options: [],
			},
			{
				name: 'saludar',
				description: 'Saluda a alguien por su nombre',
				options: [
					{
						name: 'nombre',
						description: 'A quién saludar',
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
			{
				name: 'suma',
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
			},
			{
				name: 'boton',
				description: 'Envía un mensaje con dos botones',
				options: [],
			},
			{
				name: 'formulario',
				description: 'Abre un formulario',
				options: [],
			},
			{
				name: 'ecoargs',
				description: 'Repite el primer argumento',
				options: [
					{
						name: 'texto',
						description: 'Texto a repetir',
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
		]),
	`el registro debería ser [ping, saludar, suma, boton, formulario, ecoargs] con sus opciones, fue: ${JSON.stringify(registrados[0]?.commands)}`,
);
ok(
	registrados[0]?.guildId === undefined,
	`sin GUILD_ID el registro debería ser global, guildId: ${registrados[0]?.guildId}`,
);
ok(
	logs.some((line) => line.includes('Bot listo!')),
	`el comando ready debería loguear "Bot listo!", logs: ${JSON.stringify(logs)}`,
);

// 5. /ping responde por interaction.reply.
bot.client.emit('interactionCreate', interaccionFalsa('ping'));
await sleep(200);
ok(
	respuestas.length === 1,
	`/ping debería responder 1 vez, respondió ${respuestas.length}`,
);
ok(
	/^Pong! (NaN|-?\d+) ms$/.test(respuestas[0]?.content ?? ''),
	`/ping debería responder "Pong! <n> ms", respondió: ${JSON.stringify(respuestas[0]?.content)}`,
);

// 6. Un slash desconocido no responde nada.
bot.client.emit('interactionCreate', interaccionFalsa('nope'));
await sleep(200);
ok(
	respuestas.length === 1,
	`/nope no debería responder nada, hay ${respuestas.length} respuestas`,
);

// 7. Una interacción que no es slash ni componente (p. ej.
// autocompletado) se ignora.
bot.client.emit('interactionCreate', interaccionFalsa('ping', false));
await sleep(200);
ok(
	respuestas.length === 1,
	`una interacción no slash no debería responder, hay ${respuestas.length} respuestas`,
);

// 8. /saludar nombre:Jeff responde con $option.
bot.client.emit(
	'interactionCreate',
	interaccionFalsa('saludar', true, { nombre: 'Jeff' }),
);
await sleep(200);
ok(
	respuestas.length === 2,
	`/saludar debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[1]?.content === 'Hola, Jeff!',
	`/saludar debería responder "Hola, Jeff!", respondió: ${JSON.stringify(respuestas[1]?.content)}`,
);

// 9. /suma a:2 b:3 responde con $option anidado en $sum.
bot.client.emit(
	'interactionCreate',
	interaccionFalsa('suma', true, { a: 2, b: 3 }),
);
await sleep(200);
ok(
	respuestas.length === 3,
	`/suma debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[2]?.content === '2 + 3 = 5',
	`/suma debería responder "2 + 3 = 5", respondió: ${JSON.stringify(respuestas[2]?.content)}`,
);

// 10. /ecoargs demuestra que $args también funciona en slash.
bot.client.emit(
	'interactionCreate',
	interaccionFalsa('ecoargs', true, { texto: 'hola' }),
);
await sleep(200);
ok(
	respuestas.length === 4,
	`/ecoargs debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[3]?.content === 'hola de hola',
	`/ecoargs debería responder "hola de hola", respondió: ${JSON.stringify(respuestas[3]?.content)}`,
);

// 11. !eco hola mundo repite los argumentos con $args.
bot.client.emit('messageCreate', mensajeFalso('!eco hola mundo'));
await sleep(200);
ok(
	enviados.length === 2,
	`!eco debería enviar 1 mensaje más, hay ${enviados.length} mensajes`,
);
ok(
	enviados[1]?.content === 'hola mundo',
	`!eco debería responder "hola mundo", respondió: ${JSON.stringify(enviados[1]?.content)}`,
);

// 12. !eco sin argumentos no envía nada: Scope.generate decide en
// compilación si hay algo que enviar mirando el código, y un comando que
// es solo una función ($args, $message...) siempre cuenta como "tiene
// contenido" aunque la función devuelva "" en ejecución. La guarda en
// ejecución de Scope.generate evita enviar ese mensaje vacío, que
// Discord rechazaría en producción.
bot.client.emit('messageCreate', mensajeFalso('!eco'));
await sleep(200);
ok(
	enviados.length === 2,
	`!eco sin argumentos no debería enviar nada, hay ${enviados.length} mensajes`,
);

// 13. /boton responde con un mensaje con dos botones ($addButton).
bot.client.emit('interactionCreate', interaccionFalsa('boton'));
await sleep(200);
ok(
	respuestas.length === 5,
	`/boton debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[4]?.content === 'Pulsa un botón',
	`/boton debería responder "Pulsa un botón", respondió: ${JSON.stringify(respuestas[4]?.content)}`,
);
ok(
	respuestas[4]?.components?.length === 1 &&
		respuestas[4].components[0].components.length === 2 &&
		respuestas[4].components[0].components[0].custom_id === 'saludo_btn' &&
		respuestas[4].components[0].components[0].label === '¡Salúdame!' &&
		respuestas[4].components[0].components[1].custom_id === 'no_btn',
	`/boton debería enviar 2 botones en una fila, envió: ${JSON.stringify(respuestas[4]?.components)}`,
);

// 14. El clic en "¡Salúdame!" llega al comando de tipo 'component'
// con ese customId y, con $interactionUpdate, EDITA el mensaje original
// en vez de responder con uno nuevo.
bot.client.emit(
	'interactionCreate',
	componenteFalso({ esBoton: true, customId: 'saludo_btn' }),
);
await sleep(200);
ok(
	respuestas.length === 5,
	`el botón no debería responder con un mensaje nuevo, hay ${respuestas.length} respuestas`,
);
ok(
	actualizaciones.length === 1,
	`el botón debería editar el mensaje 1 vez, lo hizo ${actualizaciones.length}`,
);
ok(
	actualizaciones[0]?.content === '¡Hola! Has pulsado el botón.',
	`el botón debería editar el mensaje a "¡Hola! Has pulsado el botón.", lo editó a: ${JSON.stringify(actualizaciones[0]?.content)}`,
);

// 15. El clic en "No, gracias" también edita el mensaje original.
bot.client.emit(
	'interactionCreate',
	componenteFalso({ esBoton: true, customId: 'no_btn' }),
);
await sleep(200);
ok(
	respuestas.length === 5,
	`el botón no debería responder con un mensaje nuevo, hay ${respuestas.length} respuestas`,
);
ok(
	actualizaciones.length === 2,
	`el botón debería editar el mensaje 2 veces, lo hizo ${actualizaciones.length}`,
);
ok(
	actualizaciones[1]?.content === 'Vale, no pasa nada.',
	`el botón debería editar el mensaje a "Vale, no pasa nada.", lo editó a: ${JSON.stringify(actualizaciones[1]?.content)}`,
);

// 16. Un botón sin comando no responde ni edita nada.
bot.client.emit(
	'interactionCreate',
	componenteFalso({ esBoton: true, customId: 'sin_comando' }),
);
await sleep(200);
ok(
	respuestas.length === 5,
	`un botón sin comando no debería responder, hay ${respuestas.length} respuestas`,
);
ok(
	actualizaciones.length === 2,
	`un botón sin comando no debería editar nada, hay ${actualizaciones.length} ediciones`,
);

// 17. /formulario muestra el modal ($showModal).
bot.client.emit('interactionCreate', interaccionFalsa('formulario'));
await sleep(200);
ok(
	modales.length === 1,
	`/formulario debería mostrar 1 modal, mostró ${modales.length}`,
);
ok(
	modales[0]?.custom_id === 'form' &&
		modales[0]?.title === 'Cuéntame algo' &&
		modales[0]?.components[0]?.components[0]?.custom_id === 'nombre' &&
		modales[0]?.components[0]?.components[0]?.label === 'Tu nombre',
	`/formulario debería mostrar el modal "form" con el campo "nombre", mostró: ${JSON.stringify(modales[0])}`,
);

// 18. El envío del modal llega al comando 'form' y $textInputValue
// lee el campo.
bot.client.emit(
	'interactionCreate',
	componenteFalso({ esModal: true, customId: 'form', valores: { nombre: 'Jeff' } }),
);
await sleep(200);
ok(
	respuestas.length === 6,
	`el modal debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[5]?.content === 'Me has dicho: Jeff',
	`el modal debería responder "Me has dicho: Jeff", respondió: ${JSON.stringify(respuestas[5]?.content)}`,
);

// 19. Un menú: los valores elegidos llegan como $args.
bot.client.emit(
	'interactionCreate',
	componenteFalso({ esMenu: true, customId: 'elegir', valores: { opcion: 'a' } }),
);
await sleep(200);
ok(
	respuestas.length === 7,
	`el menú debería responder 1 vez, hay ${respuestas.length} respuestas`,
);
ok(
	respuestas[6]?.content === 'Elegiste: a',
	`el menú debería responder "Elegiste: a", respondió: ${JSON.stringify(respuestas[6]?.content)}`,
);

console.log = logOriginal;

if (fallos.length) {
	console.error('FALLOS:');
	for (const fallo of fallos) console.error(` - ${fallo}`);
	process.exit(1);
}

console.log(`OK: !ping respondió ${JSON.stringify(enviados[0].content)}`);
console.log(`OK: /ping respondió ${JSON.stringify(respuestas[0].content)}`);
console.log(
	`OK: /ping se registró como slash: ${JSON.stringify(registrados[0].commands)}`,
);
console.log('OK: !nope, /nope, mensajes sin prefijo e interacciones no slash ni componente no hicieron nada.');
console.log('OK: el comando ready se ejecutó al emitir ready.');
console.log(`OK: /saludar respondió ${JSON.stringify(respuestas[1].content)}`);
console.log(`OK: /suma respondió ${JSON.stringify(respuestas[2].content)}`);
console.log(`OK: /ecoargs respondió ${JSON.stringify(respuestas[3].content)}`);
console.log(`OK: !eco respondió ${JSON.stringify(enviados[1].content)}`);
console.log(`OK: /boton respondió con 2 botones: ${JSON.stringify(respuestas[4].components)}`);
console.log(`OK: el botón editó el mensaje a ${JSON.stringify(actualizaciones[0].content)}`);
console.log(`OK: el otro botón editó el mensaje a ${JSON.stringify(actualizaciones[1].content)}`);
console.log(`OK: /formulario mostró el modal: ${JSON.stringify(modales[0])}`);
console.log(`OK: el modal respondió ${JSON.stringify(respuestas[5].content)}`);
console.log(`OK: el menú respondió ${JSON.stringify(respuestas[6].content)}`);
console.log('Cableado verificado sin conectarse a Discord.');
