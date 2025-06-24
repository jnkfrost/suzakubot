const { ANIME_GROUP_ID, POKEMON_GROUP_ID } = require('../config/groups');

const easterEggsPokemon = [
  {
    regex: /\bteam rocket\b/i,
    reply: `😈 Il Team Rocket è pronto a partire!
Jessie: Preparatevi a passare dei guai!
James: Dei guai molto grossi!
Jessie: Proteggeremo il mondo dalla devastazione!
James: Uniremo tutti i popoli nella nostra nazione!
Jessie: Denunceremo i mali della verità e dell'amore!
James: Estenderemo il nostro potere fino alle stelle!
Jessie: Jessie!
James: E James!
Jessie: Il Team Rocket viaggia alla velocità della luce!
James: Arrendetevi subito, o non avrete scampo!
Meowth: Miao, proprio così!`
  },
  {
    regex: /\bmagikarp\b/i,
    reply: '🐟 Magikarp... Splash! (non succede nulla)'
  },
  {
    regex: /\bguzma\b/i,
    reply: 'siete tutti stupidi! Io sono il capo dei Capopalestra di Alola, Guzma!'
  },
  {
    regex: /\bpantaloni\b|\bpantaloncini\b|\bvestiti\b/i,
    reply: 'Mi piacciono i pantaloncini, sono comodi e facili da indossare'
  },
  {
    regex: /\ballenatore\b/i,
    reply: 'Parte la sfida di Gennaro Bullo! Sei pronto?'
  },
  {
    regex: /\bpokedex\b/i,
    reply: 'Il Pokédex è uno strumento indispensabile per ogni Allenatore Pokémon!'
  },
  {
    regex: /\bpok[ée]ball\b/i,
    reply: 'Hai lanciato una Pokéball! Ma il Pokémon è scappato...'
  },
  {
    regex: /\bpikachu\b/i,
    reply: 'Pikachu, fulmine! ⚡️ Pika-pika!'
  },
  {
    regex: /\bevolv[ei][rt]o?\b/i,
    reply: 'Congratulazioni! Il tuo Pokémon si sta evolvendo... Oh no, hai premuto B!'
  },
  {
    regex: /\bsquirtle squad\b/i,
    reply: '😎 Squirtle Squad in azione!'
  },
  {
    regex: /\bmewtwo\b/i,
    reply: 'Mewtwo: "Io sono nato per combattere, non per essere comandato."'
  },
  {
    regex: /\bsnorlax\b/i,
    reply: 'Snorlax sta dormendo profondamente... 😴'
  },
  {
    regex: /\bbici\b|\bbicicletta\b/i,
    reply: '🚲 "C\'è un tempo e un luogo per ogni cosa, ma non ora!" — Prof. Oak'
  }
];

const easterEggsAnime = [
  { regex: /\bteam rocket\b/i, reply: "Sembra che il Team Rocket stia di nuovo tentando di rubare i Pokémon!" },
  { regex: /\bmagikarp\b/i, reply: "🐟 Magikarp... Splash! (non succede nulla)" },
  { regex: /\bbankai\b/i, reply: "BAN-KAI! (Bleach hype!)" },
  { regex: /\bkamehameha\b/i, reply: "Kaaa... meee... haaa... meee... HAAAAAA! 💥" },
  { regex: /\bzelda\b/i, reply: "It’s dangerous to go alone! Take this. 🗡️" },
  { regex: /\bkonami\b/i, reply: "↑ ↑ ↓ ↓ ← → ← → B A — Codice inserito!" },
  { regex: /\bbazinga\b/i, reply: "Sheldon approves this message! 🧠" },
  { regex: /\btardis\b/i, reply: "🚪 *Sembra più grande all'interno!*" },
  { regex: /\bsonico\b/i, reply: "🔦 *Non uscire mai senza il tuo cacciavite sonico!*" },
  { regex: /\bcacciavite sonico\b/i, reply: "🔦 *Non uscire mai senza il tuo cacciavite sonico!*" },
  { regex: /\brigenerazione\b/i, reply: "✨ *Il Dottore cambia aspetto, ma resta sempre il Dottore!*" },
  { regex: /\bdalek\b/i, reply: "🛸 *EX-TER-MI-NATE!*" },
  { regex: /\bgallifrey\b/i, reply: "🌌 *Gallifrey si trova nei cieli della costellazione di Kasterborous!*" },
  { regex: /\bnon voltarti\b/i, reply: "🗿 *Non voltarti mai! Gli Angeli Piangenti sono dietro di te...*" },
  { regex: /\bstatua\b/i, reply: "🗿 *Non voltarti mai! Gli Angeli Piangenti sono dietro di te...*" }
];

async function handleEasterEggs(message, chat) {
  const groupId = chat.id._serialized;
  const body = message.body;

  if (groupId === POKEMON_GROUP_ID) {
    for (const egg of easterEggsPokemon) {
      if (egg.regex.test(body)) {
        await message.reply(egg.reply);
        return true;
      }
    }
  }

  if (groupId === ANIME_GROUP_ID) {
    for (const egg of easterEggsAnime) {
      if (egg.regex.test(body)) {
        await message.reply(egg.reply);
        return true;
      }
    }
  }

  return false;
}

module.exports = { handleEasterEggs };
