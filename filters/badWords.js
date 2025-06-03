const { normalizzaDoppioni, normalizzaTesto, regexVariantiParola } = require('../utils/textUtils');

const paroleBanditeRaw = [
    "puttana", "puttane", "puttano", "puttani",
    "frocio", "froci", "frocia", "frocie",
    "negro", "negri", "negra", "niger", "negretto", "negrone",
    "ricchione", "ricchioni", "ricchiona",
    "sborra", "sborrata", "sborrate", "sborrano",
    "leccare i piedi", "leccata di piedi", "leccate di piedi", "leccapiedi",
    "succhiare i cazzi", "succhiacazzi", "succhiando cazzi", "succhiacazzo",
    "bitch", "bitches",
    "fag", "fags", "faggot", "faggots",
    "nigger", "niggers", "nigga", "niggas",
    "whore", "whores",
    "suck dick", "sucks dick", "sucking dick", "suck my dick", "suck cocks", "suck cock",
    "foot licking", "foot licker", "lick my feet", "lick feet",
    "cum", "cumming", "cumshot"
];

const cocktailRegex = /\bnegroni\b/i;

const paroleBanditeRegex = paroleBanditeRaw.map(p =>
    new RegExp(`\\b${regexVariantiParola(p)}\\b`, 'i')
);

/**
 * Rileva parole offensive o volgari camuffate
 * @param {string} text
 * @returns {boolean}
 */
function contieneParolaBanditaLocale(text) {
    const cleanText = normalizzaTesto(text);
    const normalizzato = normalizzaDoppioni(cleanText);

    if (cocktailRegex.test(normalizzato)) return false;

    return paroleBanditeRegex.some(re => re.test(cleanText) || re.test(normalizzato));
}

module.exports = { contieneParolaBanditaLocale };
