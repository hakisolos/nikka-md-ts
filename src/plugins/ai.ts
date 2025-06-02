import AI from "../lib/utilities/ai";

nikka(
    {
        pattern: "groq",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.groq(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'GROQ AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/3bcpd4.png',
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)

nikka(
    {
        pattern: "llama",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.llama(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'LLAMA AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/aosa0o.png',
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)


nikka(
    {
        pattern: "meta",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.meta(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'META AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/5k8y7w.jpg,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)

nikka(
    {
        pattern: "gpt",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.gpt(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'GPT AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/sjmagl.jpg,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)


nikka(
    {
        pattern: "claude",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.claude(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'CLAUDE AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/029p0p.png,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)

nikka(
    {
        pattern: "hakiu",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.hakiu(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'HAKIU AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/kjm5ro.png,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)

nikka(
    {
        pattern: "jeevs",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.jeevs(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'JEEVES AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/au28dg.jpg,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)


nikka(
    {
        pattern: "maths",
        desc: "response from  ai",
        public: false,
        category: "ai",
        react: true

    },
    async(m: any, {match}: {match: string}) => {
        if(!match) return m.reply(`query required`)
        const query = match.trim()
        const res = await AI.jeevs(query)
        return await sock.sendMessage(
            m.jid,
            {
                text: res,
                contextInfo: {
                    externalAdReply: {
                        title: 'MATHS AI',
                        body: 'NIKKA SOCIETY',
                        sourceUrl: '',
                        mediaUrl: '',
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                        thumbnailUrl: 'https://files.catbox.moe/au28dg.jpg,
                    },
                },
            },
            { quoted: m.raw }
        );

    }

)
