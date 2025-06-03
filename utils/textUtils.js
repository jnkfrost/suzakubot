/**
 * Rimuove caratteri doppi usati per spam o camuffamento
 */
function normalizzaDoppioni(text) {
    return text.replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ@!|0-9])\1{1,}/gi, '$1');
}

/**
 * Normalizza il testo: rimuove accenti e simboli
 */
function normalizzaTesto(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9@!|àèéìòùÀÈÉÌÒÙ\s]/g, '')
        .toLowerCase();
}

/**
 * Converte una parola in regex che tollera lettere camuffate
 */
function regexVariantiParola(parola) {
    const sostituzioni = {
        'a': '[aàáâãäå@4AÀÁÂÃÄÅ]',
        'e': '[eèéêë3EÈÉÊË]',
        'i': '[iìíîï1!|IÌÍÎÏ]',
        'o': '[oòóôõö0OÒÓÔÕÖ]',
        'u': '[uùúûüUÙÚÛÜ]',
        'n': '[nñNÑ]',
        'c': '[cC]',
        's': '[sS5$]',
        'z': '[zZ2]',
        'g': '[gG9]',
        't': '[tT7]',
        'r': '[rR]',
        'd': '[dD]',
        'l': '[lL1|!]',
        'm': '[mM]',
        'p': '[pP]',
        'f': '[fF]',
        'b': '[bB8]',
        'h': '[hH]',
        'q': '[qQ9]',
        'v': '[vV]',
        'y': '[yY]',
        'x': '[xX]'
    };

    return parola
        .split('')
        .map(c => sostituzioni[c.toLowerCase()] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('');
}

async function isAdmin(message) {
    const chat = await message.getChat();
    if (!chat.isGroup) return false;
    const userId = message.author || message.from;
    const participant = chat.participants.find(p => p.id._serialized === userId);
    return participant?.isAdmin || false;
}

module.exports = {
    normalizzaDoppioni,
    normalizzaTesto,
    regexVariantiParola,
    isAdmin
};
