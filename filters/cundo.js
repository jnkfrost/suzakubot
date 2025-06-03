const { normalizzaDoppioni, normalizzaTesto } = require('../utils/textUtils');

/**
 * Genera regex per varianti camuffate di "cundo"
 */
function regexVariantiCundo() {
    const map = {
        'c': '[cC]',
        'u': '[uùúûüUÙÚÛÜ]',
        'n': '[nñNÑ]',
        'd': '[dD]',
        'o': '[oòóôõö0OÒÓÔÕÖ]'
    };

    let regex = '';
    for (const c of 'cundo') {
        regex += map[c] || c;
    }

    return new RegExp(`\\b${regex}\\b`, 'i');
}

const reCundo = regexVariantiCundo();

/**
 * Rileva "cundo" e varianti stilizzate
 * @param {string} text
 * @returns {boolean}
 */
function contieneCundo(text) {
    const cleanText = normalizzaTesto(text);
    const normalizzato = normalizzaDoppioni(cleanText);
    return reCundo.test(cleanText) || reCundo.test(normalizzato);
}

module.exports = { contieneCundo };
