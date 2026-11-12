import type AoiClient from '@aoi.js/classes/AoiClient.js';
import { type ReturnType, type FunctionType } from './enum.js';
import {
	type AoiEventNames,
	type AsyncFunction,
	type CommandTypes,
	type FunctionCode,
} from './type.js';
import type StringObject from '../core/builders/StringObject.js';
import type Command from '@aoi.js/classes/Command.js';
import {
	type User,
	type Channel,
	type Client,
	type ClientOptions,
	type Guild,
	type Message,
	type GuildMember,
	type ApplicationCommandOptionData,
	type Interaction,
} from 'discord.js';

export interface ITranspilerOptions {
	customFunctions: Record<string, IFunctionData>;
	minify: boolean;
}

export interface ITranspileOptions {
	reverse?: boolean;
	parsedStringOnly?: boolean;
	command: Command;
	sendMessage?: boolean;
	scopeData?: IScopeData;
	asFunction?: boolean;
}

export interface IScopeData {
	vars?: string[];
	embeds?: unknown[];
	name?: string;
	sendFunction?: string;
	functions?: string[];
	env?: string[];
	object?: Record<string, StringObject>;
	embeddedJS?: string[];
	useChannel?: Snowflake | string;
	addReturn?: boolean;
}

export interface IFunctionData {
	name: string;
	brackets: boolean;
	optional: boolean;
	type: FunctionType;
	fields: IFunctionField[];
	returns: ReturnType;
	extra?: unknown;
	code: FunctionCode;
}

export interface ICodeFunctionData extends IFunctionData {
	inside?: string;
	parent?: ICodeFunctionData;
	total: string;
	splits: () => string[];
	funcs: ICodeFunctionData[];
	parsed?: string;
	executed: string;
	cmd: Command;
}

export interface IFunctionField {
	name: string;
	type: ReturnType;
	required: boolean;
	description?: string;
}

type Snowflake = bigint;

export interface ICommandOptions {
	[key: string]: unknown;
	name: string;
	type: CommandTypes;
	code: string | AsyncFunction;
	aliases?: string[];
	reverseRead?: boolean;
	executeAt?: 'guild' | 'dm' | 'both';
	// Solo para comandos de tipo 'interaction': texto que Discord muestra
	// en la lista de slash commands y sus opciones.
	description?: string;
	options?: ApplicationCommandOptionData[];
	__path__: string;
}

export interface ITranspilerData {
	bot: AoiClient;
	client: Client;
	message?: Message;
	// La interacción que disparó el comando: un slash, un botón, un
	// envío de modal o un menú. Cada tipo expone lo suyo (options solo
	// en slash, fields solo en modales, values solo en menús).
	interaction?: Interaction;
	guild?: Guild;
	channel?: Channel;
	author?: User;
	member?: GuildMember;
	command: Command;
	args?: string[];
	data?: Record<string, unknown>;
}

export interface IAoiClientOptions {
	token: `${string}.${string}.${string}`;
	intents: number;
	events: AoiEventNames[];
	prefix: string | string[];
	respond?: {
		toBot?: boolean;
		onEdit?: {
			commands?: boolean;
			alwaysExecute?: boolean;
			nonPrefixed?: boolean;
			time?: number;
		};
	};
	cache?: Record<string, number | undefined>;
	djsClientOptions?: ClientOptions;
	transpilerOptions?: ITranspilerOptions;
	testMode?: boolean;
	// Servidor donde registrar los slash commands al arrancar.
	// Con él, aparecen al instante; sin él se registran globales y pueden
	// tardar hasta 1 hora en aparecer en Discord.
	slashGuildId?: string;
}

export interface IAoiLoggerOptions {
	logs?: boolean;
	warnings?: boolean;
	errors?: boolean;
}

export interface IFnBlock {
	text: string;
	children: IFnBlock[];
	parent: IFnBlock | undefined;
}

export interface IOk<T> {
	success: true;
	data: T;
}

export interface IErr<E> {
	success: false;
	error: E;
}

export interface IMacroOptions {
	name: string;
	code: string | AsyncFunction;
}

export interface IDateTimeOptions {
	hour12: boolean;
	timezone: string;
	locale: string;
}