const { GROUP_IDS } = require('../config');
async function handleGeneralCommands(message, chat) {
    const userId = message.author || message.from;
    const msg = message.body.trim().toLowerCase();


    // Easter egg bici/bicicletta
    if (chat.id._serialized === GROUP_IDS.POKEMON) {
        if (/\bbici\b/i.test(message.body) || /\bbicicletta\b/i.test(message.body)) {
            await message.reply('🚲 "C\'è un tempo e un luogo per ogni cosa, ma non ora!" — Prof. Oak');
            return;
        }
        if (/\bteam rocket\b/i.test(message.body)) {
            await message.reply('😈 Sembra che il Team Rocket stia di nuovo tentando di rubare i Pokémon!');
            return;
        }
        if (/\bmagikarp\b/i.test(message.body)) {
            await message.reply('🐟 Magikarp... Splash! (non succede nulla)');
            return;
        }
    }


// Easter egg nerd e pop
    if (chat.id._serialized === GROUP_IDS.ANIME) {
        // Easter egg nerd, pop, anime, Doctor Who
        const easterEggs = [
            { regex: /\bteam rocket\b/i, reply: "Sembra che il Team Rocket stia di nuovo tentando di rubare i Pokémon!" },
            { regex: /\bmagikarp\b/i, reply: "Magikarp... Splash! (non succede nulla)" },
            { regex: /\bbankai\b/i, reply: "BAN-KAI! (Bleach hype!)" },
            { regex: /\bkamehameha\b/i, reply: "Kaaa... meee... haaa... meee... HAAAAAA! 💥" },
            { regex: /\bzelda\b/i, reply: "It’s dangerous to go alone! Take this. 🗡️" },
            { regex: /\bkonami\b/i, reply: "↑ ↑ ↓ ↓ ← → ← → B A — Codice inserito!" },
            { regex: /\bbazinga\b/i, reply: "Sheldon approves this message! 🧠" },
            { regex: /\btardis\b/i, reply: "🚪 *Sembra più grande all'interno!*" },
            { regex: /\bsonico\b/i, reply: "🔦 *Non uscire mai senza il tuo cacciavite sonico!*" },
            { regex: /\bcacciavite sonico\b/i, reply: "🔦 *Non uscire mai senza il tuo cacciavite sonico!*" },
            { regex: /\brigenerazione\b/i, reply: "✨ *Il Dottore cambia aspetto, ma resta sempre il Dottore!*" },
            { regex: /\bdalek\b/i, reply: "🛸 *EX-TER-MI-NATE!*" },
            { regex: /\bgallifrey\b/i, reply: "🌌 *Gallifrey si trova nei cieli della costellazione di Kasterborous!*" },
            { regex: /\bnon voltarti\b/i, reply: "🗿 *Non voltarti mai! Gli Angeli Piangenti sono dietro di te...*" },
            { regex: /\bstatua\b/i, reply: "🗿 *Non voltarti mai! Gli Angeli Piangenti sono dietro di te...*" }
        ];

        for (const egg of easterEggs) {
            if (egg.regex.test(message.body)) {
                await message.reply(egg.reply);
                return;
            }
        }
    }




    // !aiuto
    if (msg === '!aiuto') {
        return message.reply(
            `╔═════════════════════╗
║  📖 *COMANDI BOT* 📖  ║
╚═════════════════════╝
!regole   • Mostra le regole
!citazione • Citazione anime
!discord • Link Discord
!ping • Test bot
!reminder [minuti] [testo] • Promemoria personale
══════════════════════`
        );
    }

    // !regole
    if (msg === '!regole') {
        return message.reply(
            `╔═[ 📜 𝑹𝑬𝑮𝑶𝑳𝑬 𝑨𝑵𝑰𝑴𝑬/𝑷𝑶𝑲𝑬𝑴𝑶𝑵 ]═╗
1. Rispetto per tutti
2. No spoiler senza avviso!
3. Vietato NSFW
4. Parla solo di anime/manga/pokémon
5. Vietato spammare sticker
6. Vietato insultare o bestemmiare (solo anime)
╚═════════════════════╝`
        );
    }

    // !citazione
    if (msg === '!citazione') {
        const citazioni = [
            `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"Power comes in response to a need, not a desire." — Goku`,
            `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"Forgetting is like a wound. The wound may heal, but it has already left a scar." — Luffy`,
            `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"A lesson without pain is meaningless." — Edward Elric`
        ];
        const rand = Math.floor(Math.random() * citazioni.length);
        return message.reply(citazioni[rand]);
    }

    // !discord
    if (msg === '!discord') {
        return message.reply(`🔗 Unisciti al nostro server Discord:\nhttps://discord.gg/xCR6WcWrG5`);
    }

    // !ping
    if (msg === '!ping') {
        const t0 = Date.now();
        const reply = await message.reply('🏓 Pong!');
        const t1 = Date.now();
        return reply.reply(`⏱️ Tempo di risposta: ${t1 - t0} ms`);
    }

    // !reminder [minuti] [testo]
    if (msg.startsWith('!reminder')) {
        const args = message.body.trim().split(' ');
        if (args.length < 3) {
            return message.reply('⏰ Uso: !reminder [minuti] [testo]');
        }

        const minuti = parseInt(args[1]);
        if (isNaN(minuti) || minuti < 1 || minuti > 1440) {
            return message.reply('⏰ Inserisci un numero di minuti valido (1-1440).');
        }

        const testo = args.slice(2).join(' ');
        await message.reply(`⏰ Promemoria impostato tra ${minuti} minuti! Ti scriverò in privato.`);

        setTimeout(async () => {
            try {
                const contact = await message.getContact();
                await contact.sendMessage(`⏰ *Promemoria!*\n${testo}`);
            } catch (e) {
                console.error('Errore nel promemoria:', e);
            }
        }, minuti * 60 * 1000);

        return;
    }
}

module.exports = handleGeneralCommands;
