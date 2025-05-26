/** @format */

import { executeCommand } from './plugins';
import config from '../config';
import util from 'util';

interface QuotedMessage {
	sender: string;
	message?: MessageContent;
}

interface MessageContent {
	[key: string]: any;
}

interface RawMessage {
	[key: string]: any;
}

interface Message {
	body?: string;
	key?: {
		fromMe: boolean;
	};
	sender: string;
	quoted?: QuotedMessage | null;
	user?: string;
	message?: MessageContent;
	raw?: RawMessage;
	_processedButton?: boolean;
	jid: string;
	react: (emoji: string) => Promise<void>;
	reply: (text: string) => Promise<void>;
}

function isSudoOrOwner(senderJID: string): boolean {
	const senderNumber = senderJID.split('@')[0];

	if (config.SUDO && Array.isArray(config.SUDO)) {
		for (const sudo of config.SUDO) {
			if (senderNumber === sudo) {
				return true;
			}
		}
	}

	if (config.OWNER && senderNumber === config.OWNER) {
		return true;
	}

	return false;
}

async function handleMessage(m: Message): Promise<void> {
	if (!m) {
		return;
	}

	if (m.body && m.body.startsWith('$')) {
		if (!m.key?.fromMe && !isSudoOrOwner(m.sender)) {
			return;
		}

		const code = m.body.slice(1).trim();
		const result = await eval(`(async () => { ${code} })()`);
		const response = typeof result === 'string' ? result : util.inspect(result);
		await m.reply(response);
		return;
	}

	if (m.body && m.body.startsWith('#eval')) {
		if (!m.key?.fromMe && !isSudoOrOwner(m.sender)) {
			return;
		}

		const code = m.body.slice(6).trim();
		const result = await eval(`(async () => { ${code} })()`);
		const response = typeof result === 'string' ? result : util.inspect(result);
		await m.reply(response);
		return;
	}

	const commandExecuted = await executeCommand(m);
	if (commandExecuted) return;
}

export default handleMessage;
