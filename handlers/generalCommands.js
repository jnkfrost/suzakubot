async function handleGeneralCommands(message, chat) {
    const userId = message.author || message.from;
    const msg = message.body.trim().toLowerCase();

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
