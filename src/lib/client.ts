/** @format */

import {
	useMultiFileAuthState,
	DisconnectReason,
	makeWASocket,
	ConnectionUpdate,
} from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import qrcode from 'qrcode-terminal';
import { loadCommands } from './plugins';
import { connectToMongo } from '../models/mongo';
import handleMessage from './handlemessage';
import { serializeMessage } from './serialize';
type WASocket = ReturnType<typeof makeWASocket>;
declare global {
	var sock: WASocket | null;
}
global.sock = null;

export const start = async (): Promise<WASocket> => {
	await loadCommands();
	await connectToMongo();
	const { state, saveCreds } = await useMultiFileAuthState('./auth');
	const sock = makeWASocket({
		auth: state,
		printQrInTerminal: true,
		browser: ['Nikka', 'Chrome', '1.0.0'],
		syncFullHistory: false,
		markOnlineOnConnect: true,
		logger: pino({ level: 'silent' }),
	});

	sock.ev.on('creds.update', saveCreds);

	sock.ev.on('connection.update', async (update: any) => {
		const { connection, lastDisconnect, qr } = update;

		if (qr) qrcode.generate(qr, { small: true });

		if (connection === 'close') {
			const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
				?.statusCode;
			switch (statusCode) {
				case DisconnectReason.badSession:
					fs.rmSync('./auth', { recursive: true, force: true });
					await start();
					break;
				case DisconnectReason.connectionClosed:
				case DisconnectReason.connectionLost:
					await start();
					break;
				case DisconnectReason.loggedOut:
					fs.rmSync('./auth', { recursive: true, force: true });
					break;
				default:
					await start();
			}
		}

		if (connection === 'open') {
			if (sock.user?.id) {
				await sock.sendMessage(sock.user.id, {
					image: { url: 'https://files.catbox.moe/z0k3fv.jpg' },
					caption: 'Nikka Md connected',
				});
			}
		}
	});
	sock.ev.on(
		'messages.upsert',
		async (m: { messages: any[]; type: string }) => {
			try {
				const msg = m.messages[0];
				if (m.type !== 'notify') return;

				const serialized = serializeMessage(msg, sock);
				// Only process if serialized exists and has a valid fromMe property
				if (
					serialized &&
					serialized.key &&
					typeof serialized.key.fromMe === 'boolean'
				) {
					await handleMessage({
						...serialized,
						key: { ...serialized.key, fromMe: serialized.key.fromMe },
					});
				}
			} catch (err) {
				console.error('Message processing error:', err);
			}
		}
	);
	global.sock = sock;
	return sock;
};
