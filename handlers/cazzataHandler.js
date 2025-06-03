/**
 * Gestione dei comandi stupidi per il gruppo "cazzata"
 * @param {Message} message - messaggio ricevuto
 * @param {Chat} chat - oggetto chat
 */

async function handleCazzata(message, chat) {

if (msg === '!barz') {
    const barzellette = [
        "— Dottore, ho un problema con la memoria...\n— Da quanto?\n— Da quanto cosa?",
        "Sai qual è il colmo per un elettricista? Non fare scintille in società!",
        "Come si chiama un boomerang che non torna indietro?\n— Un bastone.",
        "Ieri ho incontrato una ragazza telepatica... mi ha letto nel cuore!"
    ];
    const scelta = barzellette[Math.floor(Math.random() * barzellette.length)];
    await message.reply(`😂 *Barzelletta del giorno:*\n${scelta}`);
    return;
}
}
module.exports = handleCazzata;