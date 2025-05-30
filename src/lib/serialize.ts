/** @format */

import {
	getContentType,
	downloadMediaMessage,
	jidNormalizedUser,
	proto,
} from 'baileys';
import type { WASocket, WAMessage } from 'bail';
import config from '../config';

export interface Serialize extends WAMessage {
	jid?: string;
	id?: string;
	isGroup?: boolean;
	sender?: string;
	fromMe?: boolean;
	user?: string;
	prefix?: string;
	type?: string;
	body?: string;
	raw?: any;
	content?: any;
	quoted?: any;
	mentions?: any
	send?:any
	react?: any
	reply?: any
}

export function serialize(msg: WAMessage, sock: WASocket) {
	if (!msg) return;
	const m: Serialize = { ...msg };

	m.key = msg.key ?? undefined;
	m.jid = msg.key?.remoteJid ?? undefined;
	m.id = m.key?.id ?? undefined;
	m.isGroup = m.jid?.endsWith('@g.us');
	const jidOwner = jidNormalizedUser(sock?.user?.id);
	const lidOwner = jidNormalizedUser(sock?.user?.lid);
	m.sender = m.isGroup ? jidNormalizedUser(msg.key?.participant) : jidNormalizedUser(m.jid);
	m.fromMe = [jidOwner, lidOwner].includes(m.sender);
	m.pushName = msg.pushName || 'unknown';
	m.user = jidOwner;
	m.prefix = config.PREFIX;
	const content = msg.message || null;
	m.type = getContentType(content) || '';
	if (m.type === 'conversation') {
		m.body = content?.conversation ?? undefined;
	} else if (m.type === 'extendedTextMessage') {
		m.body = content?.extendedTextMessage?.text ?? undefined;
	} else if (m.type === 'imageMessage') {
		m.body = content?.imageMessage?.caption ?? undefined;
	} else if (m.type === 'videoMessage') {
		m.body = content?.videoMessage?.caption ?? undefined;
	} else {
		m.body = '';
	}
	m.raw = msg;
	m.content = content;
	m.quoted = null;

	const quoted = (content as any)?.extendedTextMessage?.contextInfo?.quotedMessage;

	if (quoted) {
		const quotedType = getContentType(quoted);
		const contextInfo = content?.extendedTextMessage?.contextInfo;
		const quotedSender = jidNormalizedUser(contextInfo?.participant ?? '');

		const quotedMsg = {
			key: {
				remoteJid: m.jid ?? '',
				fromMe: [jidOwner, lidOwner].includes(quotedSender),
				id: contextInfo?.stanzaId ?? '',
				participant: quotedSender,
			},
			message: quoted,
		};

		m.quoted = {
			type: quotedType,
			content: quoted[quotedType],
			message: quoted,
			sender: quotedSender,
			pushname: (contextInfo as any)?.pushName || 'Unknown',
			text:
				quotedType === 'conversation'
					? quoted.conversation
					: quotedType === 'extendedTextMessage'
					? quoted.extendedTextMessage?.text
					: quotedType === 'imageMessage'
					? quoted.imageMessage?.caption
					: quotedType === 'videoMessage'
					? quoted.videoMessage?.caption
					: '',
			key: quotedMsg.key,
			isVV: Boolean(
				quoted?.viewOnceMessageV2 ||
				quoted?.viewOnceMessage ||
				quoted?.imageMessage?.viewOnce ||
				quoted?.videoMessage?.viewOnce
			),
			raw: quotedMsg,
			download: async () => {
				if (
					!quoted ||
					![
						'imageMessage',
						'videoMessage',
						'audioMessage',
						'stickerMessage',
						'documentMessage',
					].includes(quotedType)
				) {
					return null;
				}

				try {
					const buffer = await downloadMediaMessage(
						quotedMsg,
						'buffer',
						{},
						{
							reuploadRequest: sock.updateMediaMessage,
						}
					);

					return buffer;
				} catch (error) {
					console.error('Error downloading media:', error);
					return null;
				}
			},
			forward: async (jid: string, options: { quoted?: any } = {}) => {
				try {
					const forwardMsg = {
						key: quotedMsg.key,
						message: quotedMsg.message,
					};

					return await sock.sendMessage(
						jid ?? m.jid ?? '',
						{ forward: forwardMsg },
						{ quoted: options.quoted || null }
					);
				} catch (error) {
					console.error('Error forwarding message:', error);
					return null;
				}
			},
		};
	}
	m.mentions = content?.extendedTextMessage?.contextInfo?.mentionedJid || [];
	m.mentions = m.mentions.map((jid: string) => jidNormalizedUser(jid));
	m.reply = async (text: string) => {
		return await sock.sendMessage(m.key.remoteJid ?? '', { text }, { quoted: msg });
	};
	m.send = async (text: string) => {
		return await sock.sendMessage(m.key.remoteJid ?? '', { text });
	};
	m.react = async (emoji: string) => {
		return await sock.sendMessage(m.jid ?? '', {
			react: {
				text: emoji,
				key: m.key,
			},
		});
	};
	return m;

	
}
