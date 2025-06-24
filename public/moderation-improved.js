// handlers/moderation.js - Sistema di moderazione avanzato

const fs = require('fs');
const path = require('path');

// Carica configurazioni
const config = {
    antiSpam: {
        enabled: true,
        maxIdenticalMessages: 3,
        timeWindow: 30000, // 30 secondi
        stickerLimit: 10,
        stickerWindow: 20000 // 20 secondi
    },
    antiBestemmie: {
        enabled: true,
        autoDelete: true,
        warnOnOffense: true
    },
    autoMute: {
        enabled: true,
        muteDuration: 300000 // 5 minuti
    }
};

// Cache per tracking spam
const userMessageCache = new Map();
const userStickerCache = new Map();
const userMuteStatus = new Set();

// Sistema di logging per moderazione
function logModeration(action, userId, groupId, reason) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        action,
        userId,
        groupId,
        reason
    };

    // Crea cartella logs se non esiste
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Salva log di moderazione
    const logFile = path.join(logsDir, 'moderation.log');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    console.log(`[MODERAZIONE] ${action}: ${reason} - User: ${userId}`);
}

// Funzione migliorata per rilevare bestemmie
function contieneBestemmia(text) {
    const clean = text.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Pattern più sofisticati per rilevare bestemmie
    const bestemmiePatterns = [
        // Pattern base
        /\b(dio|madonna|gesu|cristo)\s+(cane|porco|maiale|merda|ladro|bastardo)\b/i,
        /\b(porco|merda)\s+(dio|madonna|gesu|cristo)\b/i,

        // Pattern con caratteri speciali
        /\bd[1!i]o\s*c[4a]n[3e]\b/i,
        /\bm[4a]donn[4a]\s*putt[4a]n[4a]\b/i,

        // Pattern attaccati
        /\bporcodio\b/i,
        /\bdioporco\b/i,
        /\bmadonnamignotta\b/i,

        // Pattern con spazi/caratteri
        /\bd\s*i\s*o\s+c\s*a\s*n\s*e\b/i,
        /\bp\s*o\s*r\s*c\s*o\s+d\s*i\s*o\b/i
    ];

    return bestemmiePatterns.some(pattern => pattern.test(clean));
}

// Anti-spam per messaggi identici
function checkSpamMessages(userId, messageText) {
    const now = Date.now();
    const userMessages = userMessageCache.get(userId) || [];

    // Rimuovi messaggi vecchi
    const recentMessages = userMessages.filter(msg => 
        now - msg.timestamp < config.antiSpam.timeWindow
    );

    // Conta messaggi identici
    const identicalCount = recentMessages.filter(msg => 
        msg.text === messageText
    ).length;

    // Aggiungi messaggio corrente
    recentMessages.push({ text: messageText, timestamp: now });
    userMessageCache.set(userId, recentMessages);

    return identicalCount >= config.antiSpam.maxIdenticalMessages;
}

// Anti-spam per sticker
function checkStickerSpam(userId) {
    const now = Date.now();
    const userStickers = userStickerCache.get(userId) || [];

    // Rimuovi sticker vecchi
    const recentStickers = userStickers.filter(timestamp => 
        now - timestamp < config.antiSpam.stickerWindow
    );

    // Aggiungi sticker corrente
    recentStickers.push(now);
    userStickerCache.set(userId, recentStickers);

    return recentStickers.length > config.antiSpam.stickerLimit;
}

// Verifica se utente è admin
async function isUserAdmin(message) {
    try {
        const chat = await message.getChat();
        if (!chat.isGroup) return false;

        const participant = chat.participants.find(p => 
            p.id._serialized === message.author
        );

        return participant && participant.isAdmin;
    } catch (error) {
        console.error('Errore nel controllo admin:', error);
        return false;
    }
}

// Funzione principale di moderazione
async function handleModeration(message, client) {
    try {
        const chat = await message.getChat();

        // Solo nei gruppi
        if (!chat.isGroup) return false;

        const userId = message.author || message.from;
        const messageText = message.body || '';
        const isAdmin = await isUserAdmin(message);

        // Gli admin sono esenti dalla moderazione
        if (isAdmin) return false;

        // Controlla se utente è mutato
        if (userMuteStatus.has(userId)) {
            await message.delete(true);
            logModeration('MESSAGE_DELETED', userId, chat.id._serialized, 'User is muted');
            return true;
        }

        // 1. Controllo bestemmie
        if (config.antiBestemmie.enabled && message.type === 'chat') {
            if (contieneBestemmia(messageText)) {
                if (config.antiBestemmie.autoDelete) {
                    await message.delete(true);
                }

                await message.reply(
                    `⚠️ **MODERAZIONE AUTOMATICA**\n` +
                    `❌ Messaggio rimosso per linguaggio inappropriato\n` +
                    `📋 Le bestemmie non sono tollerate in questo gruppo\n` +
                    `⚖️ Rispetta le regole per mantenere un ambiente positivo`
                );

                logModeration('BESTEMMIA_DETECTED', userId, chat.id._serialized, 'Inappropriate language');

                // Warn automatico se configurato
                if (config.antiBestemmie.warnOnOffense) {
                    // Qui si potrebbe integrare con il sistema di warn
                }

                return true;
            }
        }

        // 2. Anti-spam messaggi
        if (config.antiSpam.enabled && message.type === 'chat') {
            if (checkSpamMessages(userId, messageText)) {
                await message.delete(true);

                // Muta temporaneamente l'utente
                if (config.autoMute.enabled) {
                    userMuteStatus.add(userId);
                    setTimeout(() => {
                        userMuteStatus.delete(userId);
                    }, config.autoMute.muteDuration);

                    await message.reply(
                        `🚫 **ANTI-SPAM ATTIVATO**\n` +
                        `⏰ Utente silenziato per 5 minuti\n` +
                        `📢 Evita di ripetere lo stesso messaggio\n` +
                        `🤝 Mantieni la chat ordinata per tutti`
                    );
                }

                logModeration('SPAM_DETECTED', userId, chat.id._serialized, 'Repeated messages');
                return true;
            }
        }

        // 3. Anti-spam sticker
        if (config.antiSpam.enabled && message.type === 'sticker') {
            if (checkStickerSpam(userId)) {
                await message.delete(true);

                await message.reply(
                    `🔄 **CONTROLLO STICKER**\n` +
                    `⛔ Troppi sticker in poco tempo\n` +
                    `⏱️ Rallenta un po' per favore\n` +
                    `😊 Usa gli sticker con moderazione`
                );

                logModeration('STICKER_SPAM', userId, chat.id._serialized, 'Too many stickers');
                return true;
            }
        }

        // 4. Filtro link non autorizzati (esempio)
        if (message.type === 'chat' && messageText.includes('http')) {
            const hasAuthorization = false; // Qui controlli se l'utente è autorizzato

            if (!hasAuthorization) {
                await message.delete(true);
                await message.reply(
                    `🔗 **CONTROLLO LINK**\n` +
                    `❌ Link rimosso automaticamente\n` +
                    `👮 Solo gli utenti autorizzati possono condividere link\n` +
                    `💬 Contatta un admin per l'autorizzazione`
                );

                logModeration('UNAUTHORIZED_LINK', userId, chat.id._serialized, 'Link without permission');
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('Errore in handleModeration:', error);
        return false;
    }
}

// Funzioni di utilità per admin
async function muteUser(userId, duration = 300000) {
    userMuteStatus.add(userId);
    setTimeout(() => {
        userMuteStatus.delete(userId);
    }, duration);
}

async function unmuteUser(userId) {
    userMuteStatus.delete(userId);
}

function getModerationStats() {
    return {
        mutedUsers: userMuteStatus.size,
        trackedUsers: userMessageCache.size,
        stickerTracking: userStickerCache.size,
        config: config
    };
}

// Cleanup periodico delle cache
setInterval(() => {
    const now = Date.now();

    // Pulisci cache messaggi
    for (const [userId, messages] of userMessageCache.entries()) {
        const recentMessages = messages.filter(msg => 
            now - msg.timestamp < config.antiSpam.timeWindow * 2
        );

        if (recentMessages.length === 0) {
            userMessageCache.delete(userId);
        } else {
            userMessageCache.set(userId, recentMessages);
        }
    }

    // Pulisci cache sticker
    for (const [userId, stickers] of userStickerCache.entries()) {
        const recentStickers = stickers.filter(timestamp => 
            now - timestamp < config.antiSpam.stickerWindow * 2
        );

        if (recentStickers.length === 0) {
            userStickerCache.delete(userId);
        } else {
            userStickerCache.set(userId, recentStickers);
        }
    }
}, 60000); // Ogni minuto

module.exports = {
    handleModeration,
    muteUser,
    unmuteUser,
    getModerationStats,
    contieneBestemmia
};