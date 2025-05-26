/** @format */

import { proto } from '@whiskeysockets/baileys';
import type { WASocket as Socket } from '@whiskeysockets/baileys';

// Import types from your plugins file
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
	conversation?: string;
	extendedTextMessage?: {
		text?: string;
		contextInfo?: {
			mentionedJid?: string[];
		};
	};
	buttonsResponseMessage?: ButtonResponseMessage;
	listResponseMessage?: {
		singleSelectReply?: {
			selectedRowId?: string;
		};
	};
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
	jid: string;
}

/**
 * Extracts text content from various message types
 */
function extractMessageText(messageContent: any): string | undefined {
	if (!messageContent) return undefined;

	// Handle different message types
	if (messageContent.conversation) {
		return messageContent.conversation;
	}

	if (messageContent.extendedTextMessage?.text) {
		return messageContent.extendedTextMessage.text;
	}

	if (messageContent.imageMessage?.caption) {
		return messageContent.imageMessage.caption;
	}

	if (messageContent.videoMessage?.caption) {
		return messageContent.videoMessage.caption;
	}

	if (messageContent.documentMessage?.caption) {
		return messageContent.documentMessage.caption;
	}

	// Handle button responses
	if (messageContent.buttonsResponseMessage?.selectedButtonId) {
		return messageContent.buttonsResponseMessage.selectedButtonId;
	}

	// Handle list responses
	if (messageContent.listResponseMessage?.singleSelectReply?.selectedRowId) {
		return messageContent.listResponseMessage.singleSelectReply.selectedRowId;
	}

	// Handle template button responses
	if (messageContent.templateButtonReplyMessage?.selectedId) {
		return messageContent.templateButtonReplyMessage.selectedId;
	}

	return undefined;
}

function processQuotedMessage(
	contextInfo: any,
	sock: Socket
): QuotedMessage | null {
	if (!contextInfo?.quotedMessage) return null;

	try {
		const quotedSender = contextInfo.participant || contextInfo.remoteJid || '';

		return {
			sender: quotedSender,
			message: contextInfo.quotedMessage,
		};
	} catch (error) {
		console.error('Error processing quoted message:', error);
		return null;
	}
}

/**
 * Normalizes the sender JID format
 */
function normalizeSender(jid: string): string {
	if (!jid) return '';

	// Handle group messages - extract the actual sender
	if (jid.includes('@g.us') && jid.includes('_')) {
		const parts = jid.split('_');
		if (parts.length > 1) {
			return parts[0] + '@s.whatsapp.net';
		}
	}

	// Ensure proper format for individual chats
	if (!jid.includes('@')) {
		return jid + '@s.whatsapp.net';
	}

	return jid;
}

/**
 * Determines if the message is from a group
 */
function isGroupMessage(jid: string): boolean {
	return jid.includes('@g.us');
}

/**
 * Gets the actual sender in group messages
 */
function getGroupSender(key: any): string {
	if (key.participant) {
		return key.participant;
	}

	if (key.remoteJid && key.remoteJid.includes('@g.us')) {
		// For group messages, the sender should be in participant field
		// If not available, we'll use a fallback
		return key.remoteJid;
	}

	return key.remoteJid || '';
}

/**
 * Main serialization function
 */
export function serializeMessage(
	msg: proto.IWebMessageInfo,
	sock: Socket
): WhatsAppMessage | null {
	try {
		if (!msg || !msg.key || !msg.key.remoteJid) {
			return null;
		}

		const key = msg.key;
		const messageContent = msg.message;
		const messageTimestamp = msg.messageTimestamp;
		const isGroup = key.remoteJid ? isGroupMessage(key.remoteJid) : false;

		// Determine the actual sender
		let sender: string;
		if (isGroup) {
			sender = getGroupSender(key);
		} else {
			sender = key.fromMe ? sock.user?.id || '' : key.remoteJid || '';
		}

		sender = normalizeSender(sender);

		// Extract message text
		const body = extractMessageText(messageContent);

		// Process quoted message
		const contextInfo =
			messageContent?.extendedTextMessage?.contextInfo ||
			messageContent?.imageMessage?.contextInfo ||
			messageContent?.videoMessage?.contextInfo ||
			messageContent?.documentMessage?.contextInfo;

		const quoted = processQuotedMessage(contextInfo, sock);

		// Create the serialized message
		const serialized: WhatsAppMessage = {
			body,
			sender,
			key: {
				fromMe: Boolean(key.fromMe),
				id: key.id,
				remoteJid: key.remoteJid ?? undefined,
			},
			quoted,
			user: sock.user?.id || '',
			message: messageContent as MessageContent,
			raw: { message: messageContent } as RawMessage,
			jid: key.remoteJid,
			_processedButton: false,

			// React function
			react: async (emoji: string) => {
				try {
					await sock.sendMessage(key.remoteJid!, {
						react: {
							text: emoji,
							key: key,
						},
					});
				} catch (error) {
					console.error('Error sending reaction:', error);
				}
			},

			// Reply function
			reply: async (text: string) => {
				try {
					await sock.sendMessage(key.remoteJid!, {
						text: text,
						quoted: msg,
					});
				} catch (error) {
					console.error('Error sending reply:', error);
				}
			},
		};

		return serialized;
	} catch (error) {
		console.error('Error serializing message:', error);
		return null;
	}
}

/**
 * Extended reply function with more options
 */
export function createAdvancedReply(
	sock: Socket,
	originalMsg: proto.IWebMessageInfo
) {
	return async (
		content: string | any,
		options?: {
			quoted?: boolean;
			mentions?: string[];
			linkPreview?: boolean;
		}
	) => {
		try {
			const jid = originalMsg.key.remoteJid!;

			if (typeof content === 'string') {
				const messageOptions: any = {
					text: content,
				};

				if (options?.quoted !== false) {
					messageOptions.quoted = originalMsg;
				}

				if (options?.mentions) {
					messageOptions.mentions = options.mentions;
				}

				if (options?.linkPreview === false) {
					messageOptions.linkPreview = false;
				}

				await sock.sendMessage(jid, messageOptions);
			} else {
				// Handle object content (images, videos, etc.)
				if (options?.quoted !== false) {
					content.quoted = originalMsg;
				}

				await sock.sendMessage(jid, content);
			}
		} catch (error) {
			console.error('Error in advanced reply:', error);
		}
	};
}

/**
 * Utility function to check if message contains media
 */
export function hasMedia(msg: WhatsAppMessage): boolean {
	if (!msg.message) return false;

	return !!(
		msg.message.imageMessage ||
		msg.message.videoMessage ||
		msg.message.audioMessage ||
		msg.message.documentMessage ||
		msg.message.stickerMessage
	);
}

/**
 * Utility function to get media type
 */
export function getMediaType(msg: WhatsAppMessage): string | null {
	if (!msg.message) return null;

	if (msg.message.imageMessage) return 'image';
	if (msg.message.videoMessage) return 'video';
	if (msg.message.audioMessage) return 'audio';
	if (msg.message.documentMessage) return 'document';
	if (msg.message.stickerMessage) return 'sticker';

	return null;
}

/**
 * Utility function to download media
 */
export async function downloadMedia(
	msg: WhatsAppMessage,
	sock: Socket
): Promise<Buffer | null> {
	try {
		if (!hasMedia(msg) || !msg.message) {
			return null;
		}

		const messageType = getMediaType(msg);
		if (!messageType) return null;

		// Get the media message
		const mediaMessage =
			msg.message[`${messageType}Message` as keyof MessageContent];

		if (!mediaMessage) return null;

		// Download the media
		const buffer = await sock.downloadMediaMessage(msg.raw as any);
		return buffer as Buffer;
	} catch (error) {
		console.error('Error downloading media:', error);
		return null;
	}
}

/**
 * Utility to check if user is mentioned
 */
export function isMentioned(msg: WhatsAppMessage, userJid: string): boolean {
	if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
		return false;
	}

	const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
	return mentions.includes(userJid);
}

// Export types for use in other files
export type {
	WhatsAppMessage,
	MessageContent,
	MessageKey,
	QuotedMessage,
	RawMessage,
};
