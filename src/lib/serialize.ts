/** @format */

import {
	getContentType,
	downloadContentFromMessage,
	jidNormalizedUser,
	downloadMediaMessage,
	proto,
} from 'baileys';
import type { WASocket, WAMessage } from 'baileys';
import fs from 'fs';
import path from 'path';
import config from '../config';
export function serialize(msg: proto.IwebMessageInfo, sock: WASocket) {
	if (!msg) return;
	const m = {};
	m.key = msg.key;
}
