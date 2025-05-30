/** @format */
import dotenv from 'dotenv';
dotenv.config();

const toBool = (x: string | boolean | undefined): boolean =>
	x === 'true' || x === true;

interface Config {
	SUDO: string[];
	OWNER: string;
	PREFIX: string;
	MONGO_URI: string;
	ANTIDELETE_IN_CHAT: boolean;
	ANTI_DELETE: boolean;
	ANTILINK: string;
	PAIR_NUMBER: string;
	USE_PAIRING_CODE: boolean;
	BOT_IMG: string;
	GREETINGS: boolean | string;
}

const config: Config = {
	SUDO: process.env.SUDO
		? process.env.SUDO.split(',')
		: ['2349112171078', '94703981512', '2349123721026'],
	OWNER: process.env.OWNER || '2349112171078',
	PREFIX: process.env.PREFIX || '.',
	MONGO_URI: process.env.MONGO_URI || '',
	ANTIDELETE_IN_CHAT: toBool(process.env.ANTIDELETE_IN_CHAT) || false,
	ANTI_DELETE: toBool(process.env.ANTI_DELETE) || true,
	ANTILINK: process.env.ANTILINK || 'kick',
	PAIR_NUMBER: '94703981512',
	USE_PAIRING_CODE: true,
	BOT_IMG: process.env.BOT_IMG || 'https://files.catbox.moe/z0k3fv.jpg',
	GREETINGS: process.env.GREETINGS ?? true,
};

export default config;
