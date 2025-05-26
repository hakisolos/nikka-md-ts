/** @format */

import {
	WAMessage,
	WASocket,
	getContentType,
	downloadContentFromMessage,
	jidNormalizedUser,
	downloadMediaMessage,
} from 'baileys-pro';
import { proto } from 'baileys';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Import config - adjust path as needed
interface Config {
	PREFIX: string;
}

// You'll need to import or define your config
import config from '../config';
const typedConfig: Config = config;

// Type definitions
interface MediaDownload {
	buffer: Buffer;
	filename: string;
	filepath: string;
	mimetype: string;
}

interface QuotedMessage {
	type: string;
	content: any;
	message: proto.IMessage;
	sender: string;
	pushname: string;
	text: string;
	key: proto.IMessageKey;
	isVV: boolean;
	raw: proto.IWebMessageInfo;
	download: () => Promise<Buffer | null>;
	forward: (jid?: string, options?: ForwardOptions) => Promise<any>;
}

interface ForwardOptions {
	quoted?: proto.IWebMessageInfo | null;
}

interface SendMessageOptions {
	[key: string]: any;
	packname?: string;
	author?: string;
	fileName?: string;
	mimetype?: string;
}

interface PollResultParams {
	name: string;
	values: any[];
}

interface ReactContent {
	reactionText?: string;
	messageKey?: proto.IMessageKey;
}

interface StickerOptions {
	packname?: string;
	author?: string;
	[key: string]: any;
}

interface SerializedMessage {
	key: proto.IMessageKey;
	jid: string;
	fromMe: boolean;
	id: string;
	isGroup: boolean;
	sender: string;
	senderName: string;
	pushName: string;
	client: ReturnType<typeof WASocket>;
	user: string;
	prefix: string;
	type: string;
	body: string;
	raw: proto.IWebMessageInfo;
	content: proto.IMessage;
	quoted: QuotedMessage | null;
	mentions: string[];

	// Methods
	sendMessage: (
		content: any,
		opt?: SendMessageOptions,
		type?: string
	) => Promise<any>;
	reply: (text: string) => Promise<any>;
	send: (text: string) => Promise<any>;
	react: (emoji: string) => Promise<any>;
	block: (jid: string) => Promise<any>;
	unblock: (jid: string) => Promise<any>;
	delete: (jid: string, key: proto.IMessageKey) => Promise<any>;
	sendPollResult: (params: PollResultParams) => Promise<any>;
	payment: (text: string) => Promise<any>;
	sendFile: (
		bufferOrUrl: Buffer | string,
		caption?: string,
		mimetype?: string
	) => Promise<any>;
	upload: (buffer: Buffer) => Promise<string | null>;
	adReply: (text: string) => Promise<any>;
	downloadMedia: () => Promise<MediaDownload | null>;
}

// Add this type definition near the top with other interfaces
export interface Message {
	key: {
		fromMe: boolean; // Must be boolean
		// ... other key properties
	};
	// ... other message properties
}

function serializeMessage(
	msg: proto.IWebMessageInfo,
	sock: ReturnType<typeof WASocket>
): SerializedMessage | null | undefined {
	if (!msg) return null;

	const m = {} as SerializedMessage;

	// Basic message properties
	m.key = {
		...msg.key!,
		fromMe: Boolean(msg.key?.fromMe), // Explicitly convert to boolean
	};
	m.jid = msg.key!.remoteJid!;
	m.fromMe = Boolean(msg.key?.fromMe); // Ensure boolean type
	// ...rest of the code
	m.id = msg.key!.id!;
	m.isGroup = m.jid.endsWith('@g.us');

	m.sender = m.fromMe
		? jidNormalizedUser(sock.user!.id)
		: m.isGroup
		? jidNormalizedUser(msg.key!.participant!)
		: jidNormalizedUser(m.jid);

	m.senderName = msg.pushName || 'Unknown';
	m.pushName = msg.pushName || 'Unknown';
	m.client = sock;
	m.user = jidNormalizedUser(sock.user!.id);
	m.prefix = config.PREFIX;

	const content = msg.message || {};
	m.type = getContentType(content) || '';
	m.body =
		m.type === 'conversation'
			? content.conversation || ''
			: m.type === 'extendedTextMessage'
			? content.extendedTextMessage?.text || ''
			: m.type === 'imageMessage'
			? content.imageMessage?.caption || ''
			: m.type === 'videoMessage'
			? content.videoMessage?.caption || ''
			: '';

	m.raw = msg;
	m.content = content;

	// Handle quoted messages
	m.quoted = null;
	const quoted = content?.extendedTextMessage?.contextInfo?.quotedMessage;
	if (quoted) {
		const quotedType = getContentType(quoted);
		const contextInfo = content?.extendedTextMessage?.contextInfo;

		// Create a complete quoted message object for forwarding
		const quotedMsg: proto.IWebMessageInfo = {
			key: {
				remoteJid: m.jid,
				fromMe: contextInfo?.participant === m.user,
				id: contextInfo?.stanzaId,
				participant: contextInfo?.participant
					? jidNormalizedUser(contextInfo.participant)
					: undefined,
			},
			message: quoted,
		};

		m.quoted = {
			type: quotedType || '',
			content: quotedType ? (quoted as any)[quotedType] : null,
			message: quoted,
			sender: jidNormalizedUser(contextInfo?.participant || ''),
			pushname: msg.pushName || 'Unknown',
			text:
				quotedType === 'conversation'
					? quoted.conversation || ''
					: quotedType === 'extendedTextMessage'
					? quoted.extendedTextMessage?.text || ''
					: quotedType === 'imageMessage'
					? quoted.imageMessage?.caption || ''
					: quotedType === 'videoMessage'
					? quoted.videoMessage?.caption || ''
					: '',
			key: {
				remoteJid: m.jid,
				fromMe: contextInfo?.participant === m.user,
				id: contextInfo?.stanzaId,
				participant: jidNormalizedUser(contextInfo?.participant || ''),
			},
			isVV: Boolean(
				(quoted as any)?.viewOnceMessageV2 ||
					(quoted as any)?.viewOnceMessage ||
					quoted?.imageMessage?.viewOnce ||
					quoted?.videoMessage?.viewOnce
			),
			raw: quotedMsg,

			// Enhanced download method
			download: async (): Promise<Buffer | null> => {
				if (
					!quoted ||
					![
						'imageMessage',
						'videoMessage',
						'audioMessage',
						'stickerMessage',
						'documentMessage',
					].includes(quotedType || '')
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
					return buffer as Buffer;
				} catch (error) {
					console.error('Error downloading media:', error);
					return null;
				}
			},

			// Forward method
			forward: async (
				jid?: string,
				options: ForwardOptions = {}
			): Promise<any> => {
				try {
					const forwardMsg = {
						key: quotedMsg.key,
						message: quotedMsg.message,
					};

					return await sock.sendMessage(
						jid || m.jid,
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

	// Handle mentions
	m.mentions = content?.extendedTextMessage?.contextInfo?.mentionedJid || [];
	m.mentions = m.mentions.map((jid: string) => jidNormalizedUser(jid));

	/**
	 * Send messages of different types
	 */
	m.sendMessage = async (
		content: any,
		opt: SendMessageOptions = {},
		type: string = 'text'
	): Promise<any> => {
		try {
			switch (type.toLowerCase()) {
				case 'text': {
					return await sock.sendMessage(
						m.jid,
						{ text: content, ...opt },
						{ quoted: msg, ...opt }
					);
				}

				case 'image': {
					if (Buffer.isBuffer(content)) {
						return await sock.sendMessage(
							m.jid,
							{ image: content, ...opt },
							{ quoted: msg, ...opt }
						);
					} else if (
						typeof content === 'string' &&
						(content.startsWith('http://') || content.startsWith('https://'))
					) {
						return await sock.sendMessage(
							m.jid,
							{ image: { url: content }, ...opt },
							{ quoted: msg, ...opt }
						);
					}
					break;
				}

				case 'video': {
					if (Buffer.isBuffer(content)) {
						return await sock.sendMessage(
							m.jid,
							{ video: content, ...opt },
							{ quoted: msg, ...opt }
						);
					} else if (
						typeof content === 'string' &&
						(content.startsWith('http://') || content.startsWith('https://'))
					) {
						return await sock.sendMessage(
							m.jid,
							{ video: { url: content }, ...opt },
							{ quoted: msg, ...opt }
						);
					}
					break;
				}

				case 'audio': {
					if (Buffer.isBuffer(content)) {
						return await sock.sendMessage(
							m.jid,
							{ audio: content, ...opt },
							{ quoted: msg, ...opt }
						);
					} else if (
						typeof content === 'string' &&
						(content.startsWith('http://') || content.startsWith('https://'))
					) {
						return await sock.sendMessage(
							m.jid,
							{ audio: { url: content }, ...opt },
							{ quoted: msg, ...opt }
						);
					}
					break;
				}

				case 'template': {
					const { generateWAMessage } = require('baileys-pro');
					const optional = await generateWAMessage(m.jid, content, {
						quoted: msg,
						...opt,
					});
					const message = {
						viewOnceMessage: {
							message: {
								...optional.message,
							},
						},
					};
					return await sock.relayMessage(m.jid, message, {
						messageId: optional.key.id,
					});
				}

				case 'react': {
					const reactContent = content as ReactContent;
					const { reactionText = '👍', messageKey = m.key } =
						reactContent || {};

					return await sock.sendMessage(
						m.jid,
						{
							react: {
								text: reactionText,
								key: messageKey,
							},
						},
						{ quoted: msg }
					);
				}

				case 'sticker': {
					const { writeExifWebp } = require('./utilities/sticker');
					let data: Buffer;
					let mime: string;

					if (Buffer.isBuffer(content)) {
						data = content;

						// Determine mime type from buffer header
						if (content.length > 8) {
							if (
								content[0] === 0xff &&
								content[1] === 0xd8 &&
								content[2] === 0xff
							) {
								mime = 'image/jpeg';
							} else if (
								content[0] === 0x89 &&
								content[1] === 0x50 &&
								content[2] === 0x4e &&
								content[3] === 0x47
							) {
								mime = 'image/png';
							} else if (
								content[0] === 0x47 &&
								content[1] === 0x49 &&
								content[2] === 0x46
							) {
								mime = 'image/gif';
							} else if (
								content[8] === 0x57 &&
								content[9] === 0x45 &&
								content[10] === 0x42 &&
								content[11] === 0x50
							) {
								mime = 'image/webp';
							} else if (
								content[0] === 0x52 &&
								content[1] === 0x49 &&
								content[2] === 0x46 &&
								content[3] === 0x46
							) {
								mime = 'video/mp4';
							} else {
								mime = 'application/octet-stream';
							}
						} else {
							mime = 'application/octet-stream';
						}
					} else if (
						typeof content === 'string' &&
						(content.startsWith('http://') || content.startsWith('https://'))
					) {
						const response = await fetch(content);
						data = Buffer.from(await response.arrayBuffer());
						mime =
							response.headers.get('content-type') ||
							'application/octet-stream';
					} else {
						throw new Error('Invalid sticker content: Expected buffer or URL');
					}

					if (mime === 'image/webp') {
						const stickerOptions: StickerOptions = {
							packname: opt.packname || 'Xasena',
							author: opt.author || 'X-electra',
							...opt,
						};

						const buff = await writeExifWebp(data, stickerOptions);
						return await sock.sendMessage(
							m.jid,
							{ sticker: { url: buff } },
							{ quoted: msg, ...opt }
						);
					} else {
						const mainType = mime.split('/')[0];

						if (mainType === 'image' || mainType === 'video') {
							const stickerOptions: StickerOptions = {
								packname: opt.packname || 'haki',
								author: opt.author || 'X-nikka',
								...opt,
							};

							if (typeof (sock as any).sendImageAsSticker === 'function') {
								return await (sock as any).sendImageAsSticker(
									m.jid,
									data,
									stickerOptions
								);
							} else {
								const { Sticker } = require('wa-sticker-formatter');
								const sticker = new Sticker(data, {
									pack: stickerOptions.packname,
									author: stickerOptions.author,
									type: mainType === 'video' ? 'full' : 'crop',
									categories: ['🤩', '🎉'],
									id: Date.now().toString(),
									quality: 50,
								});

								const stickerBuffer = await sticker.toBuffer();
								return await sock.sendMessage(
									m.jid,
									{ sticker: stickerBuffer },
									{ quoted: msg, ...opt }
								);
							}
						} else {
							throw new Error(`Unsupported media type for sticker: ${mime}`);
						}
					}
					break;
				}

				case 'document': {
					if (Buffer.isBuffer(content)) {
						const fileName = opt.fileName || `file_${Date.now()}.bin`;
						const mimetype = opt.mimetype || 'application/octet-stream';

						return await sock.sendMessage(
							m.jid,
							{
								document: content,
								mimetype: mimetype,
								fileName: fileName,
								...opt,
							},
							{ quoted: msg, ...opt }
						);
					} else if (
						typeof content === 'string' &&
						(content.startsWith('http://') || content.startsWith('https://'))
					) {
						const fileName =
							opt.fileName ||
							content.split('/').pop() ||
							`file_${Date.now()}.bin`;
						const mimetype = opt.mimetype || 'application/octet-stream';

						return await sock.sendMessage(
							m.jid,
							{
								document: { url: content },
								mimetype: mimetype,
								fileName: fileName,
								...opt,
							},
							{ quoted: msg, ...opt }
						);
					}
					break;
				}

				default:
					throw new Error(`Unsupported message type: ${type}`);
			}
		} catch (error) {
			console.error(`Error in sendMessage (${type}):`, error);
			throw error;
		}
	};

	// Other methods
	m.reply = async (text: string): Promise<any> => {
		return await sock.sendMessage(m.jid, { text }, { quoted: msg });
	};

	m.send = async (text: string): Promise<any> => {
		return await sock.sendMessage(m.jid, { text });
	};

	m.react = async (emoji: string): Promise<any> => {
		return await sock.sendMessage(m.jid, {
			react: {
				text: emoji,
				key: m.key,
			},
		});
	};

	m.block = async (jid: string): Promise<any> => {
		return await sock.updateBlockStatus(jid, 'block');
	};

	m.unblock = async (jid: string): Promise<any> => {
		return await sock.updateBlockStatus(jid, 'unblock');
	};

	m.delete = async (jid: string, key: proto.IMessageKey): Promise<any> => {
		return sock.sendMessage(jid, { delete: key });
	};

	m.sendPollResult = async ({
		name,
		values,
	}: PollResultParams): Promise<any> => {
		return await sock.sendMessage(
			m.jid,
			{
				pollResult: {
					name: name,
					values: values,
				},
			},
			{ quoted: msg }
		);
	};

	m.payment = async (text: string): Promise<any> => {
		return await sock.sendMessage(
			m.jid,
			{
				requestPayment: {
					currency: 'IDR',
					amount: '1',
					from: m.sender,
					note: text,
					background: {
						id: '100',
						fileLength: 928283,
						width: '1000',
						height: '1000',
						mimetype: 'image/webp',
						placeholderArgb: '0xFF000000',
						textArgb: 4294967295,
						subtextArgb: 4278190080,
					},
				},
			},
			{ quoted: msg }
		);
	};

	m.sendFile = async (
		bufferOrUrl: Buffer | string,
		caption: string = '',
		mimetype: string = ''
	): Promise<any> => {
		try {
			if (
				typeof bufferOrUrl === 'string' &&
				(bufferOrUrl.startsWith('http://') ||
					bufferOrUrl.startsWith('https://'))
			) {
				if (!mimetype) {
					const extension = bufferOrUrl.split('.').pop()?.toLowerCase();
					if (extension) {
						if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
							mimetype = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
						} else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
							mimetype = `video/${extension}`;
						} else if (['mp3', 'ogg', 'wav', 'opus'].includes(extension)) {
							mimetype = `audio/${extension}`;
						} else if (extension === 'pdf') {
							mimetype = 'application/pdf';
						} else {
							mimetype = 'application/octet-stream';
						}
					} else {
						mimetype = 'application/octet-stream';
					}
				}

				if (mimetype.startsWith('image/')) {
					return await sock.sendMessage(
						m.jid,
						{ image: { url: bufferOrUrl }, caption },
						{ quoted: msg }
					);
				} else if (mimetype.startsWith('video/')) {
					return await sock.sendMessage(
						m.jid,
						{ video: { url: bufferOrUrl }, caption },
						{ quoted: msg }
					);
				} else if (mimetype.startsWith('audio/')) {
					return await sock.sendMessage(
						m.jid,
						{ audio: { url: bufferOrUrl }, mimetype },
						{ quoted: msg }
					);
				} else if (mimetype === 'image/webp') {
					return await sock.sendMessage(
						m.jid,
						{ sticker: { url: bufferOrUrl } },
						{ quoted: msg }
					);
				} else {
					return await sock.sendMessage(
						m.jid,
						{
							document: { url: bufferOrUrl },
							mimetype,
							fileName: bufferOrUrl.split('/').pop(),
						},
						{ quoted: msg }
					);
				}
			} else if (Buffer.isBuffer(bufferOrUrl)) {
				if (!mimetype) {
					try {
						const FileType = await import('file-type');
						const fileTypeResult = await FileType.fileTypeFromBuffer(
							bufferOrUrl
						);
						mimetype = fileTypeResult?.mime || 'application/octet-stream';
					} catch (err) {
						if (bufferOrUrl.length > 8) {
							if (
								bufferOrUrl[0] === 0xff &&
								bufferOrUrl[1] === 0xd8 &&
								bufferOrUrl[2] === 0xff
							) {
								mimetype = 'image/jpeg';
							} else if (
								bufferOrUrl[0] === 0x89 &&
								bufferOrUrl[1] === 0x50 &&
								bufferOrUrl[2] === 0x4e &&
								bufferOrUrl[3] === 0x47
							) {
								mimetype = 'image/png';
							} else if (
								bufferOrUrl[0] === 0x47 &&
								bufferOrUrl[1] === 0x49 &&
								bufferOrUrl[2] === 0x46
							) {
								mimetype = 'image/gif';
							} else if (
								bufferOrUrl[8] === 0x57 &&
								bufferOrUrl[9] === 0x45 &&
								bufferOrUrl[10] === 0x42 &&
								bufferOrUrl[11] === 0x50
							) {
								mimetype = 'image/webp';
							} else {
								mimetype = 'application/octet-stream';
							}
						} else {
							mimetype = 'application/octet-stream';
						}
					}
				}

				if (mimetype.startsWith('image/') && mimetype !== 'image/webp') {
					return await sock.sendMessage(
						m.jid,
						{ image: bufferOrUrl, caption },
						{ quoted: msg }
					);
				} else if (mimetype.startsWith('video/')) {
					return await sock.sendMessage(
						m.jid,
						{ video: bufferOrUrl, caption },
						{ quoted: msg }
					);
				} else if (mimetype.startsWith('audio/')) {
					return await sock.sendMessage(
						m.jid,
						{ audio: bufferOrUrl, mimetype },
						{ quoted: msg }
					);
				} else if (mimetype === 'image/webp') {
					return await sock.sendMessage(
						m.jid,
						{ sticker: bufferOrUrl },
						{ quoted: msg }
					);
				} else {
					return await sock.sendMessage(
						m.jid,
						{
							document: bufferOrUrl,
							mimetype,
							fileName: `file_${Date.now()}.${mimetype.split('/')[1] || 'bin'}`,
						},
						{ quoted: msg }
					);
				}
			} else {
				throw new Error('Invalid input: Expected buffer or URL');
			}
		} catch (error) {
			console.error('Error sending file:', error);
			return null;
		}
	};

	m.upload = async (buffer: Buffer): Promise<string | null> => {
		try {
			const MAX_FILE_SIZE_MB = 200;

			if (!Buffer.isBuffer(buffer)) {
				throw new Error('Invalid input: Expected a buffer');
			}

			const fileSizeMB = buffer.length / (1024 * 1024);
			if (fileSizeMB > MAX_FILE_SIZE_MB) {
				throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
			}

			return null;
		} catch (error) {
			console.error('Error uploading file:', error);
			return null;
		}
	};

	return m;
}
export { serializeMessage };
