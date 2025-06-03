const { isAdmin, normalizzaDoppioni } = require('../utils/textUtils');
const { contieneBestemmia } = require('../filters/bestemmie');
const { contieneParolaBanditaLocale } = require('../filters/badWords');
const { contieneCundo } = require('../filters/cundo');
const { warnCount, saveWarns } = require('../utils/storage');
const { STICKER_SPAM_LIMIT, STICKER_SPAM_WINDOW, STICKER_BLOCK_DURATION } = require('../config');

const utentiMutati = new Set();
const autorizzatiSpam = new Set();
const userStickerTimestamps = {};
const gruppiStickerBloccati = new Set();
const lastMessageMap = new Map();
const lastStickerMap = new Map();

async function handleAdminGroup(message, chat, { filtroBestemmie = true } = {}) {
    const userId = message.author || message.from;
    const msg = message.body.trim().toLowerCase();

    if (contieneParolaBanditaLocale(message.body)) {
        await message.delete(true);
        return message.reply('🚫 Messaggio cancellato: parola vietata.');
    }

    if (filtroBestemmie && contieneBestemmia(message.body)) {
        await message.delete(true);
        return message.reply('⚠️ Messaggio cancellato: bestemmia rilevata.');
    }

    if (contieneCundo(message.body)) {
        await message.delete(true);
        return message.reply('😒 Evitiamo certi termini, grazie.');
    }

    if (utentiMutati.has(userId)) {
        await message.delete(true);
        return;
    }

    await gestisciSpamMessaggi(message, userId);
    await gestisciSpamSticker(message, chat, userId);
    await gestisciComandi(message, chat, msg, userId);
}

module.exports = handleAdminGroup;


async function gestisciComandi(message, chat, msg, userId) {
    if (!msg.startsWith('!')) return;

    const isUserAdmin = await isAdmin(message);
    const mentionedIds = message.mentionedIds || [];

    // !warn
    if (msg.startsWith('!warn')) {
        if (!isUserAdmin) return message.reply('❌ Solo admin possono usare questo comando.');
        if (mentionedIds.length === 0) return message.reply('❌ Menziona un utente da ammonire.');
        const targetId = mentionedIds[0];
        let count = parseInt(warnCount.get(targetId) || '0', 10) + 1;
        warnCount.set(targetId, count);
        saveWarns();

        if (count >= 3) {
            try {
                await chat.removeParticipants([targetId]);
                warnCount.delete(targetId);
                saveWarns();
                return message.reply(`🚫 Utente bannato automaticamente dopo 3 warn.`);
            } catch {
                return message.reply('❌ Impossibile bannare dopo 3 warn.');
            }
        }
        return message.reply(`⚠️ Utente ammonito (${count}/3).`);
    }

    // !ban
    if (msg.startsWith('!ban')) {
        if (!isUserAdmin) return message.reply('❌ Solo admin possono usare questo comando.');
        if (mentionedIds.length === 0) return message.reply('❌ Menziona un utente da bannare.');
        const targetId = mentionedIds[0];
        try {
            await chat.removeParticipants([targetId]);
            warnCount.delete(targetId);
            saveWarns();
            return message.reply(`⛔ Utente bannato.`);
        } catch {
            return message.reply('❌ Impossibile bannare l’utente.');
        }
    }

    // !mute
    if (msg.startsWith('!mute')) {
        if (!isUserAdmin) return message.reply('❌ Solo admin possono usare questo comando.');
        if (mentionedIds.length === 0) return message.reply('❌ Menziona un utente da silenziare.');
        const targetId = mentionedIds[0];
        utentiMutati.add(targetId);
        return message.reply(`🔇 Utente silenziato.`);
    }

    // !unmute
    if (msg.startsWith('!unmute')) {
        if (!isUserAdmin) return message.reply('❌ Solo admin possono usare questo comando.');
        if (mentionedIds.length === 0) return message.reply('❌ Menziona un utente da desilenziare.');
        const targetId = mentionedIds[0];
        utentiMutati.delete(targetId);
        return message.reply(`🔊 Utente può di nuovo parlare.`);
    }

    // !autospam / !delspam
    if (msg.startsWith('!autospam')) {
        if (!isUserAdmin || mentionedIds.length === 0) return;
        autorizzatiSpam.add(mentionedIds[0]);
        return message.reply(`✅ Utente autorizzato a postare link social.`);
    }
    if (msg.startsWith('!delspam')) {
        if (!isUserAdmin || mentionedIds.length === 0) return;
        autorizzatiSpam.delete(mentionedIds[0]);
        return message.reply(`🔒 Autorizzazione link rimossa.`);
    }

    // !bloccagruppo / !sbloccagruppo
    if (msg === '!bloccagruppo' && isUserAdmin) {
        await chat.setMessagesAdminsOnly(true);
        return message.reply('🔒 Gruppo bloccato.');
    }
    if (msg === '!sbloccagruppo' && isUserAdmin) {
        await chat.setMessagesAdminsOnly(false);
        gruppiStickerBloccati.delete(chat.id._serialized);
        return message.reply('🔓 Gruppo sbloccato.');
    }

    // !ping
    if (msg === '!ping') {
        const t0 = Date.now();
        const reply = await message.reply('🏓 Pong!');
        const t1 = Date.now();
        return reply.reply(`⏱️ Tempo di risposta: ${t1 - t0}ms`);
    }
}


async function gestisciSpamMessaggi(message, userId) {
    if (message.type !== 'chat') return;
    const current = message.body;
    const last = lastMessageMap.get(userId) || { text: '', count: 0 };

    if (last.text === current) {
        last.count += 1;
        if (last.count > 2) {
            await message.delete(true);
            await message.reply('🛑 Messaggio ripetuto troppe volte.');
            return;
        }
    } else {
        last.text = current;
        last.count = 1;
    }
    lastMessageMap.set(userId, last);
}


async function gestisciSpamSticker(message, chat, userId) {
    if (message.type !== 'sticker') return;

    const isUserAdmin = await isAdmin(message);
    if (isUserAdmin) return;

    const key = `${chat.id._serialized}_${userId}`;
    const now = Date.now();
    let timestamps = userStickerTimestamps[key] || [];
    timestamps = timestamps.filter(ts => now - ts <= STICKER_SPAM_WINDOW);
    timestamps.push(now);
    userStickerTimestamps[key] = timestamps;

    if (timestamps.length === STICKER_SPAM_LIMIT) {
        await message.delete(true);
        if (!gruppiStickerBloccati.has(chat.id._serialized)) {
            await chat.setMessagesAdminsOnly(true);
            gruppiStickerBloccati.add(chat.id._serialized);
            await chat.sendMessage(
                `🚨 Troppi sticker inviati!\n🔒 Solo admin possono scrivere per 5 minuti.`
            );
            setTimeout(async () => {
                gruppiStickerBloccati.delete(chat.id._serialized);
                await chat.setMessagesAdminsOnly(false);
                await chat.sendMessage('✅ Gruppo sbloccato automaticamente.');
            }, STICKER_BLOCK_DURATION);
        }
        return;
    }

    if (timestamps.length > STICKER_SPAM_LIMIT) {
        await message.delete(true);
    }
}
