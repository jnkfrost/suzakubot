// moderation.js

// Normalizza lettere ripetute (es: cundooooo -> cundo)
function normalizzaDoppioni(text) {
  return text.replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ@!|0-9])\1{1,}/gi, '$1');
}

// Genera regex varianti (es: bestemmie, parole bandite)
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
    't': '[tT7+]',
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
    'x': '[xX]',
  };
  let regex_str = '';
  for (const c of parola) {
    if (sostituzioni[c.toLowerCase()]) {
      regex_str += sostituzioni[c.toLowerCase()];
    } else if (c === ' ') {
      regex_str += '\\s+';
    } else {
      regex_str += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return regex_str;
}

// --- Filtro bestemmie ---
function contieneBestemmia(text) {
  const clean = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const bestemmie = [
    "dio", "madonna", "gesu", "cristo", "maria", "giuseppe",
    "santantonio", "santagata", "santanna", "santamaria", "sanpietro", "sanpaolo",
    "sanluigi", "sanfrancesco", "sanrocco", "sanlorenzo", "sanmartino", "sanmichele",
    "sansebastiano", "sanvito", "sanbiagio", "sanremo", "sanluca", "sanbernardo",
    "sancristoforo", "sanvalentino", "sanraffaele"
  ];
  const animali = [
    "cane", "maiale", "porco", "gatto", "capra", "pecora", "asino", "zebra", "cammello", "coniglio", "bue", "toro", "oca", "papera", "pollo", "tacchino", "anatra"
  ];
  const insulti = [
    "puttana", "troia", "zoccola", "negro", "merda", "ladro", "bastardo", "infame", "porca", "bestia", "schifoso", "diavolo", "ladra", "ladri"
  ];
  const variantiOffensive = [
    "dionegro", "dio negro", "dio merda", "dio ladro", "dio bastardo", "dio infame", "dio porco", "porcodio", "dioporco",
    "madonna puttana", "madonnaputtana", "madonna troia", "madonnatroia", "madonna zoccola", "madonnazoccola", "madonna porca", "madonnaporca",
    "madonna porca puttana", "madonnaporcaputtana", "madonna puttana porca", "madonnaputtanaporca",
    "porca madonna", "porcamadonna", "porca madonna puttana", "porcamadonna puttana", "porca madonna troia", "porcamadonna troia",
    "porca maria", "porcamaria", "madonna negra", "madonnanegra"
  ];

  // Varianti con "a" in mezzo (es: madonna a pecora)
  for (let b of ["madonna", "maria", "cristo", "dio"]) {
    for (let a of [...animali, ...insulti]) {
      const reA = new RegExp(`\\b${regexVariantiParola(b)}\\s*a\\s*${regexVariantiParola(a)}\\b`, 'i');
      const reAAttaccato = new RegExp(`${regexVariantiParola(b)}a${regexVariantiParola(a)}`, 'i');
      if (reA.test(clean) || reAAttaccato.test(clean)) {
        return true;
      }
    }
  }
  // Regex per varianti offensive (con lettere/numeri)
  for (let v of variantiOffensive) {
    const re = new RegExp(`\\b${regexVariantiParola(v.replace(/\s+/g, ''))}\\b`, 'i');
    if (re.test(clean.replace(/\s+/g, ''))) {
      return true;
    }
  }
  // Combinazioni classiche, attaccate e con spazi, con varianti
  for (let b of bestemmie) {
    const bVar = regexVariantiParola(b);
    const re1 = new RegExp(`\\b${regexVariantiParola('porco')}\\s*${bVar}\\b`, 'i');
    const re2 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('porco')}\\b`, 'i');
    const re3 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('cane')}\\b`, 'i');
    const re4 = new RegExp(`\\b${regexVariantiParola('porco')}\\s*${bVar}\\s*${regexVariantiParola('cane')}\\b`, 'i');
    const re5 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('maiale')}\\b`, 'i');
    const re6 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('merda')}\\b`, 'i');
    const re7 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('ladro')}\\b`, 'i');
    const re8 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('bastardo')}\\b`, 'i');
    const re9 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('bestia')}\\b`, 'i');
    const re10 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('schifoso')}\\b`, 'i');
    const re11 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('diavolo')}\\b`, 'i');
    const re12 = new RegExp(`\\b${bVar}\\s*${regexVariantiParola('infame')}\\b`, 'i');
    const re13 = new RegExp(`\\b${bVar}\\s*(${animali.map(regexVariantiParola).join('|')})\\b`, 'i');
    const re14 = new RegExp(`${bVar}(${animali.map(regexVariantiParola).join('|')})`, 'i');
    const re15 = new RegExp(`(${regexVariantiParola('porco')}${bVar})`, 'i');
    const re16 = new RegExp(`(${bVar}${regexVariantiParola('porco')})`, 'i');
    const re17 = new RegExp(`${bVar}\\s*di\\s*${regexVariantiParola('merda')}`, 'i');
    if (
      re1.test(clean) || re2.test(clean) || re3.test(clean) || re4.test(clean) ||
      re5.test(clean) || re6.test(clean) || re7.test(clean) || re8.test(clean) ||
      re9.test(clean) || re10.test(clean) || re11.test(clean) || re12.test(clean) ||
      re13.test(clean) || re14.test(clean) || re15.test(clean) || re16.test(clean) ||
      re17.test(clean)
    ) {
      return true;
    }
  }
  return false;
}

// --- Filtro "cundo" e varianti ---
function regexVariantiCundo() {
  const map = {
    'c': '[cC]',
    'u': '[uùúûüUÙÚÛÜ]',
    'n': '[nñNÑ]',
    'd': '[dD]',
    'o': '[oòóôõö0OÒÓÔÕÖ]'
  };
  let base = 'cundo';
  let regex = '';
  for (const c of base) {
    regex += map[c] || c;
  }
  return new RegExp(`\\b${regex}\\b`, 'i');
}
const reCundo = regexVariantiCundo();

function contieneCundo(text) {
  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9@!|àèéìòùÀÈÉÌÒÙ\s]/g, "");
  const normalizzato = normalizzaDoppioni(cleanText);
  return reCundo.test(cleanText) || reCundo.test(normalizzato);
}

// --- Filtro parole bandite (locale) ---
const paroleBanditeRaw = [
  "puttana", "puttane", "puttano", "puttani",
  "frocio", "froci", "frocia", "frocie",
  "negro", "negri", "negra",
  "niger", "negretto", "negrone",
  "ricchione", "ricchioni", "ricchiona",
  "sborra", "sborrata", "sborrate", "sborrano",
  "succhiare i cazzi", "succhiacazzi", "succhiando cazzi", "succhiacazzo",
  "bitch", "bitches",
  "fag", "fags", "faggot", "faggots",
  "nigger", "niggers", "nigga", "niggas",
  "whore", "whores",
  "suck dick", "sucks dick", "sucking dick", "suck my dick", "suck cocks", "suck cock",
  "foot licking", "foot licker", "lick my feet", "lick feet",
  "cum", "cumming", "cumshot" , "cumshots", "cumslut", "cumsluts",
  "asshole", "assholes", "asshole", "assholes",
  "dickhead", "dickheads", "dickhead", "dickheads",
];
const paroleBanditeRegex = paroleBanditeRaw.map(p =>
  new RegExp(`\\b${regexVariantiParola(p)}\\b`, 'i')
);

function contieneParolaBanditaLocale(text) {
  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9@!|àèéìòùÀÈÉÌÒÙ\s]/g, "");
  const normalizzato = normalizzaDoppioni(cleanText);
  const cocktailRegex = /\bnegroni\b/i;
  if (cocktailRegex.test(normalizzato)) {
    return false;
  }
  return paroleBanditeRegex.some(re => re.test(cleanText) || re.test(normalizzato));
}

module.exports = {
  contieneBestemmia,
  contieneCundo,
  contieneParolaBanditaLocale,
  normalizzaDoppioni
};
