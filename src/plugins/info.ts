import { formatUptime, measureRuntime } from "../lib/utils";
nikka(
    {
        pattern: 'ping',
        desc: 'Check bot responsiveness',
        usage: '!ping',
        category: 'info',
        react: false,
        public: false,
    },
    async (m: any) => {
        const start = Date.now();
        const response = await m.reply('Measuring ping...'); 
        const end = Date.now();
        await global.sock.sendMessage(m.jid, {
            text: `Pong! ${end - start}ms`,
            edit: response.key, 
        });
    }
);

nikka(
    {
        pattern: "alive",
        desc: "Check if bot is alive",
        public: false,
        category: "info",
        react: true,
    },
    async (m: any) => {
        const text = `NIKKA-MD STATUS\n\n User: ${m.pushName}\n Prefix: ${m.prefix}\n Uptime: ${formatUptime()}\n\n> Powered by NIKKA Team `
        return await sock.sendMessage(
                    m.jid,
                    {
                        text: text,
                        contextInfo: {
                            externalAdReply: {
                                title: 'I AM ALIVE',
                                body: 'NIKKA SOCIETY',
                                sourceUrl: '',
                                mediaUrl: '',
                                mediaType: 1,
                                showAdAttribution: true,
                                renderLargerThumbnail: false,
                                thumbnailUrl: 'https://files.catbox.moe/agj0kg.png',
                            },
                        },
                    },
                    { quoted: m.raw }
                );
    }
    
)



nikka(
    {
        pattern: "menu",
        desc: "Display all bot commands by categories",
        usage: "!menu [category/command]",
        category: "info",
        react: true,
        public: true,
    },
    async (m: any, { args, prefix }: { args: string[], prefix: string }) => {
        const { commands } = await import("../lib/plugins");

        const generateCategoryMenu = async (categoryName: string, cmds: string[]): Promise<string> => {
            const botName = "𝗡𝗶𝗸𝗸𝗮  𝗺𝗱";
            const owner = "Haki";
            const readMore = String.fromCharCode(8206).repeat(4001);
            const fancyBotName = botName;

            const [date, time] = new Date()
                .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                .split(",");

            let menu = `\`\`\`╭─𖣘 "NIKKA MD 𖣘
🌸 Prefix: ${prefix}
🌸 Owner: ${owner}
🌸 Date: ${date}
🌸 Category: ${categoryName.toUpperCase()}
🌸 Commands: ${cmds.length}
╰───────\`\`\`\n${readMore}`;

            cmds.sort((a, b) => a.localeCompare(b)).forEach(cmd => {
                menu += `\n│\`\`\`❀ ${cmd.trim()}\`\`\``;
            });

            menu += `\n╰───────\n\n\`\`\`𝗡𝗶𝗸𝗸𝗮 𝘅 𝗺𝗱\`\`\``;

            return menu
        };

        if (args.length > 0) {
            const query = args[0].toLowerCase();

            for (const [pattern, cmd] of commands.entries()) {
                const patternStr = pattern instanceof RegExp ? pattern.toString() : pattern;
                if (patternStr.includes(query)) {
                    return await m.reply(`\`\`\`Command: ${prefix}${patternStr}
Description: ${cmd.desc}
Usage: ${cmd.usage}
Category: ${cmd.category}\`\`\``);
                }
            }

            const categories = new Set<string>();
            const categoryCommands: string[] = [];

            for (const [pattern, cmd] of commands.entries()) {
                const category = cmd.category ? cmd.category.toLowerCase() : "misc";
                categories.add(category);

                if (category === query) {
                    const patternStr = pattern instanceof RegExp ? pattern.toString() : pattern;
                    categoryCommands.push(patternStr);
                }
            }

            if (categories.has(query) && categoryCommands.length > 0) {
                const categoryMenu = await generateCategoryMenu(query, categoryCommands);

                const menuImages = [
                    "https://files.catbox.moe/z0k3fv.jpg",
                    "https://files.catbox.moe/z0k3fv.jpg",
                    "https://files.catbox.moe/z0k3fv.jpg",
                ];

                const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)];

                return await global.sock.sendMessage(m.jid, {
                    image: { url: randomImage },
                    caption: categoryMenu,
                });
            }

            return await m.reply(`"${query}" not found as a command or category. Use !menu to see all categories.`);
        }

        const botName = "NIKKA MD";
        const owner = "Haki";
        const readMore = String.fromCharCode(8206).repeat(4001);
        const fancyBotName = botName

        const [date, time] = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }).split(",");

        let menu = `\`\`\`╭─𖣘 ${fancyBotName} 𖣘
🌸 Prefix: ${prefix}
🌸 Owner: ${owner}
🌸 Date: ${date}
🌸 Cmds: ${commands.size}
╰───────\`\`\`\n${readMore}`;

        let cmnd: { cmd: string; type: string }[] = [];
        let category: string[] = [];

        for (const [pattern, cmd] of commands.entries()) {
            const patternStr = pattern instanceof RegExp ? pattern.toString() : pattern;
            const type = cmd.category ? cmd.category.toLowerCase() : "misc";

            cmnd.push({ cmd: patternStr, type });
            if (!category.includes(type)) category.push(type);
        }

        cmnd.sort((a, b) => a.cmd.localeCompare(b.cmd));
        category.sort().forEach(category => {
            menu += `\n\`\`\`╭── ${category.toUpperCase()} ──\`\`\``;

            let categoryCommands = cmnd.filter(({ type }) => type === category);

            categoryCommands.forEach(({ cmd }) => {
                menu += `\n│\`\`\`❀ ${cmd.trim()}\`\`\``;
            });

            menu += `\n╰───────\n\n`;
        });

        menu += `\n\n\`\`\`𝗡𝗶𝗸𝗸𝗮 𝘅 𝗺𝗱\`\`\``;

        let finalMenu = menu;

        const menuImages = [
            "https://files.catbox.moe/z0k3fv.jpg",
            "https://files.catbox.moe/z0k3fv.jpg",
            "https://files.catbox.moe/z0k3fv.jpg",
        ];

        const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)];

        return await sock.sendMessage(
            m.jid,
            {
                video: {url: "https://files.catbox.moe/fsud10.mp4"},
                caption: finalMenu,
            }
        )
        
    }
);



