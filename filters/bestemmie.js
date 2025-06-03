const { normalizzaDoppioni, normalizzaTesto } = require('../utils/textUtils');

const bestemmie = [
    "dio", "madonna", "gesu", "cristo", "maria", "giuseppe",
    "santantonio", "santagata", "santanna", "santamaria", "sanpietro", "sanpaolo",
    "sanluigi", "sanfrancesco", "sanrocco", "sanlorenzo", "sanmartino", "sanmichele",
    "sansebastiano", "sanvito", "sanbiagio", "sanremo", "sanluca", "sanbernardo",
    "sancristoforo", "sanvalentino", "sanraffaele"
];

const animali = [
    "cane", "maiale", "porco", "gatto", "capra", "pecora", "asino",
    "bue", "pollo", "toro", "oca", "tacchino", "coniglio"
];

/**
 * Verifica se il testo contiene bestemmie
 * @param {string} text
 * @returns {boolean}
 */
function contieneBestemmia(text) {
    const clean = normalizzaTesto(text);
    const normalizzato = normalizzaDoppioni(clean);

    for (const b of bestemmie) {
        const patterns = [
            `porco\\s*${b}`, `${b}\\s*porco`,
            `${b}\\s*cane`, `porco\\s*${b}\\s*cane`,
            `${b}\\s*maiale`, `${b}\\s*merda`,
            `${b}\\s*ladro`, `${b}\\s*bastardo`,
            `${b}\\s*bestia`, `${b}\\s*schifoso`,
            `${b}\\s*diavolo`, `${b}\\s*infame`,
            `${b}\\s*(${animali.join('|')})`,
            `${b}(${animali.join('|')})`, `porco${b}`, `${b}porco`,
            `${b}\\s*di\\s*merda`
        ];

        for (const p of patterns) {
            const re = new RegExp(p, 'i');
            if (re.test(clean) || re.test(normalizzato)) {
                return true;
            }
        }
    }

    return false;
}

module.exports = { contieneBestemmia };
