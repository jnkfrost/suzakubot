const { GROUP_IDS } = require('../config');
const handleAdminGroup = require('./adminHandler');
const handleCazzata = require('./cazzataHandler');
const handleGeneralCommands = require('./generalCommands');


/**
 * Smista i messaggi in base al gruppo
 * @param {Message} message - Oggetto messaggio da whatsapp-web.js
 * @param {Chat} chat - Oggetto chat associato
 */
async function messageRouter(message, chat) {
    const groupId = chat.id._serialized;

    switch (groupId) {
        case GROUP_IDS.ANIME:
            await handleAdminGroup(message, chat, { filtroBestemmie: true });
            break;

        case GROUP_IDS.POKEMON:
            await handleAdminGroup(message, chat, { filtroBestemmie: false });
            break;

        case GROUP_IDS.CAZZATA:
            await handleCazzata(message, chat);
            break;

        case GROUP_IDS.PROVABOT:
            await handleAdminGroup(message, chat, { filtroBestemmie: true });
            await handleCazzata(message, chat);
            break;

        default:
            // Altri gruppi ignorati o log per debug
            break;
    }
}

module.exports = messageRouter;
