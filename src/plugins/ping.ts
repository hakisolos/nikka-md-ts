/** @format */
/*import { nikka } from '../lib/plugins';
nikka(
	{
		pattern: 'ping',
		desc: 'Check bot responsiveness',
		usage: '!ping',
		category: 'info',
		react: true,
		public: false,
	},
	async m => {
		const start = Date.now();
		const response = await m.reply('Measuring ping...'); // Store the response for later editing
		const end = Date.now();

		
		await global.sock.sendMessage(m.jid, {
			text: `Pong! ${end - start}ms`,
			edit: response.key, // Edit the message using the stored key
		});
	}
);

*/
