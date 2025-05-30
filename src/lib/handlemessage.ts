import { executeCommand } from "./plugins";
import config from '../config';
import util from 'util'
import type {Serialize} from "./serialize"


function isSudoOrOwner(senderJid: string): boolean {
	const senderNum = senderJid.split("@")[0]
	if (config.SUDO && Array.isArray(config.SUDO)) {
			for (const sudo of config.SUDO) {
				if (senderNum === sudo) {
					return true;
				}
			}
		}
		if (config.OWNER && senderNum === config.OWNER) {
			return true;
		}
		return false
}

export async function handleMessage(m: Serialize) {
	if (!m) {
		return;
	}

	if (m.body && m.body.startsWith('$')) {
		if (!(m.key && m.fromMe) && !isSudoOrOwner(m.sender ?? '')) {
			return;
		}

		const code = m.body.slice(1).trim();
		const result = await eval(`(async () => { ${code} })()`);
		const response = typeof result === 'string' ? result : util.inspect(result);
		await m.reply(response) 
		console.log(response)
		return;
	}

	// Add type guard to ensure sender exists
	if (!m.sender) {
		console.log('Message sender is undefined, skipping command execution');
		return;
	}

	const commandExecuted = await executeCommand(m as any);
	if (commandExecuted) return;
}