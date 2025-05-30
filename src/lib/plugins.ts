/** @format */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { WASocket } from 'baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface Config {
	PREFIX: string;
	SUDO?: string[];
	OWNER?: string;
}

interface MessageKey {
	fromMe?: boolean;
	id?: string;
	remoteJid?: string;
}

interface QuotedMessage {
	sender: string;
	message?: any;
}

interface ButtonResponseMessage {
	selectedButtonId?: string;
}

interface RawMessage {
	message?: {
		buttonsResponseMessage?: ButtonResponseMessage;
	};
}

interface MessageContent {
	imageMessage?: any;
	videoMessage?: any;
	documentMessage?: any;
	stickerMessage?: any;
	audioMessage?: any;
	pollCreationMessage?: any;
	contactMessage?: any;
	locationMessage?: any;
}

interface WhatsAppMessage {
	body?: string;
	sender: string;
	key?: MessageKey;
	quoted?: QuotedMessage | null;
	user?: string;
	message?: MessageContent;
	raw?: RawMessage;
	_processedButton?: boolean;
	react: (emoji: string) => Promise<void>;
	reply: (text: string) => Promise<void>;
	send?: (text: string) => Promise<void>; // Added for backward compatibility
	jid: string;
}

interface CommandInfo {
	pattern: string;
	desc: string;
	usage: string;
	category: string;
	react?: boolean;
	public?: boolean;
}

interface CommandContext {
	match: string;
	args: string[];
	command: string;
	prefix: string;
}

interface EventContext {
	eventType: string;
}

interface CommandOptions {
	pattern: string | RegExp;
	desc?: string;
	usage?: string;
	category?: string;
	react?: boolean;
	public?: boolean;
}

interface EventOptions {
	on: string;
	desc?: string;
	public?: boolean;
	react?: boolean;
}

interface Command extends Required<Omit<CommandOptions, 'pattern'>> {
	pattern: string | RegExp;
	callback: (m: WhatsAppMessage, context: CommandContext) => Promise<void>;
}

interface EventHandler {
	type: string;
	desc: string;
	public: boolean;
	react: boolean;
	callback: (m: WhatsAppMessage, context: EventContext) => Promise<void>;
}

interface GlobalSock {
	user: {
		id: string;
	};
}

// Define EVENT_TYPES type first
type EventTypesConstant = {
	readonly TEXT: 'text';
	readonly IMAGE: 'image';
	readonly VIDEO: 'video';
	readonly DOCUMENT: 'document';
	readonly STICKER: 'sticker';
	readonly AUDIO: 'audio';
	readonly REPLY_TO_BOT: 'reply';
	readonly ANY: 'any';
	readonly POLL: 'poll';
	readonly CONTACT: 'contact';
	readonly LOCATION: 'location';
};

// Global declarations
declare global {
	var sock: any;
	var nikka: any;
	var EVENT_TYPES: EventTypesConstant;
}

// Import config with proper typing
import config from '../config';
const typedConfig: Config = config;
const commands = new Map<string | RegExp, Command>();
const eventHandlers = new Map<string, EventHandler[]>();
const PREFIX: string = config.PREFIX;

// Event types
const EVENT_TYPES = {
	TEXT: 'text',
	IMAGE: 'image',
	VIDEO: 'video',
	DOCUMENT: 'document',
	STICKER: 'sticker',
	AUDIO: 'audio',
	REPLY_TO_BOT: 'reply',
	ANY: 'any',
	POLL: 'poll',
	CONTACT: 'contact',
	LOCATION: 'location',
} as const;

type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Function overloads for nikka
function nikka(
	options: CommandOptions | EventOptions,
	callback: (
		m: WhatsAppMessage,
		context: CommandContext | EventContext
	) => Promise<void>
):
	| {
			type: 'command';
			options: Command;
			callback: (m: WhatsAppMessage, context: CommandContext) => Promise<void>;
	  }
	| {
			type: 'event';
			options: EventHandler;
			callback: (m: WhatsAppMessage, context: EventContext) => Promise<void>;
	  };

function nikka(
	options: CommandOptions | EventOptions,
	callback: (
		m: WhatsAppMessage,
		context: CommandContext | EventContext
	) => Promise<void>
):
	| {
			type: 'command';
			options: Command;
			callback: (m: WhatsAppMessage, context: CommandContext) => Promise<void>;
	  }
	| {
			type: 'event';
			options: EventHandler;
			callback: (m: WhatsAppMessage, context: EventContext) => Promise<void>;
	  } {
	if ('on' in options) {
		const eventOptions = options as EventOptions;
		const eventType = eventOptions.on;
		const handler: EventHandler = {
			type: eventType,
			desc: eventOptions.desc || `${eventType} event handler`,
			public: eventOptions.public !== undefined ? eventOptions.public : true,
			react: eventOptions.react || false,
			callback: callback as (
				m: WhatsAppMessage,
				context: EventContext
			) => Promise<void>,
		};

		if (!eventHandlers.has(eventType)) {
			eventHandlers.set(eventType, []);
		}
		eventHandlers.get(eventType)!.push(handler);

		console.log(`📝 Registered event handler: ${eventType}`);

		return {
			type: 'event',
			options: handler,
			callback: callback as (
				m: WhatsAppMessage,
				context: EventContext
			) => Promise<void>,
		};
	}

	// Otherwise, register a command
	const commandOptions = options as CommandOptions;
	const cmdOptions: Command = {
		pattern: commandOptions.pattern || '',
		desc: commandOptions.desc || 'No description provided',
		usage: commandOptions.usage || '',
		category: commandOptions.category || 'misc',
		react: commandOptions.react || false,
		public: commandOptions.public !== undefined ? commandOptions.public : true,
		callback: callback as (
			m: WhatsAppMessage,
			context: CommandContext
		) => Promise<void>,
	};

	commands.set(cmdOptions.pattern, cmdOptions);
	console.log(`📝 Registered command: ${cmdOptions.pattern} (public: ${cmdOptions.public})`);

	return {
		type: 'command',
		options: cmdOptions,
		callback: callback as (
			m: WhatsAppMessage,
			context: CommandContext
		) => Promise<void>,
	};
}

function hasPermission(m: WhatsAppMessage, cmd: Command | EventHandler): boolean {
	console.log('🔐 Checking permissions:', {
		isPublic: cmd.public,
		sender: m.sender,
		botId: global.sock?.user?.id,
		sudoUsers: config.SUDO,
		owner: config.OWNER
	});

	if (cmd.public === true) {
		console.log('✅ Command is public');
		return true;
	}

	const senderNumber = m.sender.split('@')[0];
	const botNumber = global.sock?.user?.id?.split('@')[0];

	if (m.key && m.key.fromMe) {
		console.log('✅ Message from bot itself');
		return true;
	}
	
	if (senderNumber === botNumber) {
		console.log('✅ Sender is bot');
		return true;
	}

	if (
		(config.SUDO && config.SUDO.includes(senderNumber)) ||
		(config.OWNER && config.OWNER === senderNumber)
	) {
		console.log('✅ Sender is SUDO/Owner');
		return true;
	}

	console.log('❌ Permission denied');
	return false;
}

async function executeCommand(m: WhatsAppMessage): Promise<boolean> {
	console.log('🔍 executeCommand called with message:', {
		body: m.body,
		sender: m.sender,
		hasPrefix: m.body?.startsWith(PREFIX),
		prefix: PREFIX,
		totalCommands: commands.size
	});

	// Ensure backward compatibility - if send method exists, use it as fallback
	if (!m.reply && m.send) {
		m.reply = m.send;
	}

	// Handle button response messages
	const buttonId = m.raw?.message?.buttonsResponseMessage?.selectedButtonId;
	if (buttonId && !m._processedButton) {
		console.log(`🔘 Button pressed: ${buttonId}`);
		m._processedButton = true;

		// If the buttonId starts with the prefix, process it as a command
		if (buttonId.startsWith(PREFIX)) {
			const input = buttonId.slice(PREFIX.length).trim();
			const args = input.split(/\s+/);
			const command = args.shift()!.toLowerCase();
			const match = args.join(' ');

			console.log('🔘 Processing button command:', { command, args, match });

			// Find and execute the matched command
			for (const [pattern, cmd] of commands.entries()) {
				const isMatch =
					(typeof pattern === 'string' && pattern.toLowerCase() === command) ||
					(pattern instanceof RegExp && pattern.test(command));

				if (isMatch) {
					try {
						if (!hasPermission(m, cmd)) {
							console.log('❌ Permission denied for button command');
							return true;
						}

						if (cmd.react) await m.react('⏳');

						await cmd.callback(m, { match, args, command, prefix: PREFIX });

						if (cmd.react) await m.react('✅');
						console.log('✅ Button command executed successfully');
						return true;
					} catch (err) {
						const error = err as Error;
						console.error(`❌ Error executing button command ${command}:`, error);
						await m.reply(`Error executing command: ${error.message}`);
						if (cmd.react) await m.react('❌');
						return true;
					}
				}
			}

			await m.reply(`No handler found for button command: ${buttonId}`);
			return true;
		} else {
			// Handle custom buttons without prefix
			if (buttonId === 'alive') {
				await m.reply(
					'*Bot is alive and running!* 🌸\n\n• Version: 1.0.0\n• Status: Online\n• Uptime: ' +
						formatUptime(process.uptime()) +
						'\n\n_Powered by Wisteria MD_'
				);
				return true;
			}
		}
	}

	// Regular command handling
	if (m.body && m.body.startsWith(PREFIX)) {
		const input = m.body.slice(PREFIX.length).trim();
		const args = input.split(/\s+/);
		const command = args.shift()!.toLowerCase();
		const match = args.join(' ');

		console.log('📝 Command parsed:', {
			input,
			command,
			args,
			match,
			totalCommands: commands.size
		});

		console.log('📋 Registered commands:', Array.from(commands.keys()));

		for (const [pattern, cmd] of commands.entries()) {
			let isMatch = false;
			
			if (typeof pattern === 'string') {
				isMatch = pattern.toLowerCase() === command;
			} else if (pattern instanceof RegExp) {
				isMatch = pattern.test(command);
			}

			console.log(`🔄 Checking pattern "${pattern}" against command "${command}":`, isMatch);

			if (isMatch) {
				console.log('✅ Command matched! Checking permissions...');
				
				try {
					if (!hasPermission(m, cmd)) {
						console.log('❌ Permission denied for command');
						await m.reply('❌ You don\'t have permission to use this command.');
						return true;
					}

					console.log('🚀 Executing command...');

					if (cmd.react) {
						await m.react('⏳').catch(console.error);
					}

					await cmd.callback(m, { match, args, command, prefix: PREFIX });

					if (cmd.react) {
						await m.react('✅').catch(console.error);
					}
					
					console.log('✅ Command executed successfully');
					return true;
				} catch (err) {
					const error = err as Error;
					console.error(`❌ Error executing command ${command}:`, error);
					
					try {
						await m.reply(`❌ Error executing command: ${error.message}`);
					} catch (replyError) {
						console.error('❌ Failed to send error reply:', replyError);
					}
					
					if (cmd.react) {
						await m.react('❌').catch(console.error);
					}
					return true;
				}
			}
		}

		console.log('❌ No command matched');
	} else {
		console.log('📝 Message does not start with prefix or has no body');
	}

	// If no command matched, try to handle as an event
	return await handleEvent(m);
}

// Helper function to format uptime nicely
function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / (24 * 60 * 60));
	seconds -= days * 24 * 60 * 60;
	const hours = Math.floor(seconds / (60 * 60));
	seconds -= hours * 60 * 60;
	const minutes = Math.floor(seconds / 60);
	seconds = Math.floor(seconds - minutes * 60);

	let uptime = '';
	if (days > 0) uptime += `${days}d `;
	if (hours > 0) uptime += `${hours}h `;
	if (minutes > 0) uptime += `${minutes}m `;
	uptime += `${seconds}s`;

	return uptime;
}

async function handleEvent(m: WhatsAppMessage): Promise<boolean> {
	console.log('📨 handleEvent called for message type detection');

	// First check for replies to the bot
	if (
		m.quoted !== null &&
		m.quoted!.sender === m.user &&
		eventHandlers.has(EVENT_TYPES.REPLY_TO_BOT)
	) {
		console.log('📬 Detected reply to bot');
		const replyHandlers = eventHandlers.get(EVENT_TYPES.REPLY_TO_BOT)!;
		for (const handler of replyHandlers) {
			try {
				if (!hasPermission(m, handler)) continue;

				if (handler.react) await m.react('⏳');
				await handler.callback(m, { eventType: EVENT_TYPES.REPLY_TO_BOT });
				if (handler.react) await m.react('✅');
			} catch (err) {
				const error = err as Error;
				console.error(`Error in reply to bot handler:`, error);
				if (handler.react) await m.react('❌');
			}
		}
		return true;
	}

	// Determine event type based on message content
	let eventType: EventType;
	const messageContent = m.message || {};

	if (messageContent.imageMessage) {
		eventType = EVENT_TYPES.IMAGE;
	} else if (messageContent.videoMessage) {
		eventType = EVENT_TYPES.VIDEO;
	} else if (messageContent.documentMessage) {
		eventType = EVENT_TYPES.DOCUMENT;
	} else if (messageContent.stickerMessage) {
		eventType = EVENT_TYPES.STICKER;
	} else if (messageContent.audioMessage) {
		eventType = EVENT_TYPES.AUDIO;
	} else if (messageContent.pollCreationMessage) {
		eventType = EVENT_TYPES.POLL;
	} else if (messageContent.contactMessage) {
		eventType = EVENT_TYPES.CONTACT;
	} else if (messageContent.locationMessage) {
		eventType = EVENT_TYPES.LOCATION;
	} else {
		eventType = EVENT_TYPES.TEXT;
	}

	console.log(`📨 Detected event type: ${eventType}`);

	let handled = false;

	// Process specific event type handlers
	if (eventHandlers.has(eventType)) {
		console.log(`📨 Processing ${eventType} handlers`);
		const typeHandlers = eventHandlers.get(eventType)!;
		for (const handler of typeHandlers) {
			try {
				if (!hasPermission(m, handler)) continue;

				if (handler.react) await m.react('⏳');
				await handler.callback(m, { eventType });
				if (handler.react) await m.react('✅');
				handled = true;
			} catch (err) {
				const error = err as Error;
				console.error(`Error in ${eventType} handler:`, error);
				if (handler.react) await m.react('❌');
			}
		}
	}

	// Process 'any' handlers
	if (eventHandlers.has(EVENT_TYPES.ANY)) {
		console.log(`📨 Processing 'any' handlers`);
		const anyHandlers = eventHandlers.get(EVENT_TYPES.ANY)!;
		for (const handler of anyHandlers) {
			try {
				if (!hasPermission(m, handler)) continue;

				if (handler.react) await m.react('⏳');
				await handler.callback(m, { eventType });
				if (handler.react) await m.react('✅');
				handled = true;
			} catch (err) {
				const error = err as Error;
				console.error(`Error in 'any' handler:`, error);
				if (handler.react) await m.react('❌');
			}
		}
	}

	return handled;
}

// Function to install plugins from eval code
function installPluginFromCode(pluginCode: string): boolean {
	try {
		const contextFunction = new Function(
			'nikka',
			'EVENT_TYPES',
			'require',
			pluginCode
		);

		contextFunction(nikka, EVENT_TYPES, require);
		return true;
	} catch (error) {
		console.error('Failed to install plugin from code:', error);
		return false;
	}
}

async function loadCommands(): Promise<void> {
	const pluginsFolder = path.join(__dirname, '../plugins');

	if (!fs.existsSync(pluginsFolder)) {
		console.error('❌ Plugins folder not found at', pluginsFolder);
		return;
	}

	console.log('🔧 Installing plugins...');

	const files = fs
		.readdirSync(pluginsFolder)
		.filter(file => file.endsWith('.ts'));

	commands.clear();
	eventHandlers.clear();

	for (const file of files) {
		try {
			const pluginPath = pathToFileURL(path.join(pluginsFolder, file)).href;
			console.log(`📦 Loading plugin: ${file}`);
			await import(pluginPath);
		} catch (error) {
			console.error(`❌ Failed to load plugin ${file}:`, error);
		}
	}

	console.log(`🎉 Plugins installed successfully! Total commands: ${commands.size}, Total event handlers: ${Array.from(eventHandlers.values()).flat().length}`);
}

// Make nikka global so it can be accessed from eval code
global.nikka = nikka;
global.EVENT_TYPES = EVENT_TYPES;

export {
	nikka,
	executeCommand,
	loadCommands,
	commands,
	eventHandlers,
	PREFIX,
	EVENT_TYPES,
	installPluginFromCode,
	// Export types for use in other files
	type WhatsAppMessage,
	type CommandContext,
	type EventContext,
	type CommandOptions,
	type EventOptions,
	type Command,
	type EventHandler,
	type EventType,
};