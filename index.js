const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fetch = require('node-fetch');
const schedule = require('node-schedule');

// === ID GRUPPI ===
const ANIME_GROUP_ID = '393336520050-1495999108@g.us';        // SuzakuTV 🐦‍🔥
const POKEMON_GROUP_ID = '120363284707786265@g.us'; // Pokémon
const CAZZATA_GROUP_ID = '120363111600332295@g.us';           // CAZZATA
const PROVABOT_GROUP_ID = '120363402008805194@g.us';          // Prova bot

const GENERIC_GROUP_IDS = [ANIME_GROUP_ID, PROVABOT_GROUP_ID];

const warnFilePath = './warns.json';

let warnCount = new Map();
if (fs.existsSync(warnFilePath)) {
  const data = fs.readFileSync(warnFilePath);
  try {
    const parsed = JSON.parse(data);
    warnCount = new Map(Object.entries(parsed));
  } catch (e) {
    console.error('Errore caricando warns da file:', e);
  }
}
function saveWarns() {
  const obj = Object.fromEntries(warnCount);
  fs.writeFile(warnFilePath, JSON.stringify(obj, null, 2), (err) => {
    if (err) console.error('Errore salvando warns:', err);
  });
}
const autorizzatiSpam = new Set();
const utentiMutati = new Set();

let userStickerTimestamps = {};
const STICKER_SPAM_LIMIT = 10;
const STICKER_SPAM_WINDOW = 20 * 1000;
let gruppiStickerBloccati = new Set();
const STICKER_BLOCK_DURATION = 5 * 60 * 1000;

function normalizzaDoppioni(text) {
  return text.replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ@!|0-9])\1{1,}/gi, '$1');
}
function regexVariantiBestemmia(parola) {
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
    'x': '[xX]',
  };
  let regex_str = '';
  for (const c of parola) {
    if (sostituzioni[c.toLowerCase()]) {
      regex_str += sostituzioni[c.toLowerCase()];
    } else {
      regex_str += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return regex_str;
}
function contieneBestemmia(text) {
  const clean = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-ZàèéìòùÀÈÉÌÒÙ\s]/g, "");
  const normalizzato = normalizzaDoppioni(clean);
  const porco = '[pP][oòóôõö0OÒÓÔÕÖ][rR][cC][oòóôõö0OÒÓÔÕÖaàáâãäå@4AÀÁÂÃÄÅ]?';
  const bestemmie = [
    "dio", "madonna", "gesu", "cristo", "maria", "giuseppe"
  ];
  for (let b of bestemmie) {
    const bVar = regexVariantiBestemmia(b);
    const re1 = new RegExp(`\\b${porco}\\s*${bVar}\\b`, 'i');
    const re2 = new RegExp(`\\b${bVar}\\s*${porco}\\b`, 'i');
    if (re1.test(clean) || re2.test(clean) || re1.test(normalizzato) || re2.test(normalizzato)) {
      return true;
    }
  }
  return false;
}
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
const paroleBanditeRaw = [
  "puttana", "puttane", "puttano", "puttani",
  "frocio", "froci", "frocia", "frocie",
  "negro", "negri", "negra",
  "niger", "negretto", "negrone",
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
const lastMessageMap = new Map();
const lastStickerMap = new Map();
const MAX_IDENTICAL = 2;
const MAX_STICKER = 1;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-infobars',
      '--disable-web-security',
      '--disable-site-isolation-trials',
      '--no-experiments',
      '--ignore-gpu-blacklist',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--enable-features=NetworkService',
      '--log-level=3'
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51.html'
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);
  groups.forEach(group => {
    console.log(`GRUPPO: ${group.name} | ID: ${group.id._serialized}`);
  });
  console.log('✅ Bot attivo!');
  // Messaggi di buongiorno per gruppo anime
  schedule.scheduleJob('0 7 * * 1-5', async function(){
    await client.sendMessage(ANIME_GROUP_ID, 
`╭━☀️━━━━━━━☀️━╮
    𝑩𝒖𝒐𝒏𝒈𝒊𝒐𝒓𝒏𝒐 𝑵𝒂𝒌𝒂𝒎𝒂!
╰━☀️━━━━━━━☀️━╯
Svegliatevi e sorridete, è una nuova giornata!`);
  });
  schedule.scheduleJob('0 9 * * 6', async function(){
    await client.sendMessage(ANIME_GROUP_ID, 
`╭───────────────╮
│  🌈  *BUON SABATO!*  🌈  │
╰───────────────╯
Godetevi il weekend! 🎉`);
  });
  schedule.scheduleJob('0 9 * * 0', async function(){
    await client.sendMessage(ANIME_GROUP_ID, 
`╭───────────────╮
│  🌞  *BUONA DOMENICA!*  🌞  │
╰───────────────╯
Rilassatevi e divertitevi! 🥐`);
  });
});

client.on('group_participants_changed', async (notification) => {
  const chat = await notification.getChat();
  const groupId = chat.id._serialized;

  // Gruppo anime: messaggi classici
  if (groupId === ANIME_GROUP_ID) {
    if (notification.action === 'add') {
      for (const participant of notification.participants) {
        const contact = await client.getContactById(participant);
        const welcomeMsg =
  `╔════════════════════════════╗
  🎉 *Benvenutə nel gruppo, @${contact.id.user}!*
  ╚════════════════════════════╝
  
  🧡 Raccontaci un po’ di te:
  • Nome & Età
  • Da dove vieni?
  
  🤍 Qual è il tuo anime, manga, serie TV o film preferito?
  
  🌸 Siamo felici di averti qui, buona permanenza!
  🎧 (Ricorda di mutare il gruppo, qui si parla tanto!)
  
  ⚠️ *Importante:*  
  Leggi con attenzione le regole 👉 https://rentry.co/tbgmyb8h  
  Per mantenere il gruppo un posto piacevole per tutti!
  
  —
  
  🙏 Se hai domande, non esitare a chiedere!`;
        await chat.sendMessage(welcomeMsg, { mentions: [contact] });
      }
    }
    if (notification.action === 'remove') {
      for (const participant of notification.participants) {
        const contact = await client.getContactById(participant);
        const addioMsg = 
` ╭───────────────────╮
  │  👋  *Addio*  👋  │
  ╰───────────────────╯
@${contact.id.user} ha lasciato il gruppo.`;
        await chat.sendMessage(addioMsg, { mentions: [contact] });
      }
    }
  }

  // Gruppo Pokémon: messaggi personalizzati
  if (groupId === POKEMON_GROUP_ID) {
    if (notification.action === 'add') {
      for (const participant of notification.participants) {
        const contact = await client.getContactById(participant);
        const welcomeMsg =
  `━━━━━━━━━━━━━━━━━━━━━━
  🎓 *Salve! Benvenutə, @${contact.id.user}!*
  
  Mi chiamo *Professor Oak* e ti do il benvenuto nel gruppo Pokémon!
  
  ✨ Questo mondo è abitato da creature chiamate *Pokémon*!  
  Qui, Allenatori e Allenatrici come te si riuniscono per condividere avventure, scambi, battaglie e tanta passione!
  
  🔎 Raccontaci:
  • Il tuo nome da Allenatore/Allenatrice
  • Il tuo Pokémon preferito
  • Da quale regione inizi la tua avventura?
  
  📚 Ricorda di rispettare le regole del gruppo per rendere questa community un posto accogliente per tutti:
  https://rentry.co/tbgmyb8h
  
  🌟 Buona permanenza e...  
  Gotta catch 'em all!
  
  ---
  
  🎴 *Nota importante:*  
  Questo gruppo è dedicato non solo a Pokémon, ma anche a tutti i giochi di carte collezionabili (TCG)!
  Sentiti libero di parlare di Magic, Yu-Gi-Oh!, One Piece TCG, Lorcana e di condividere tutte le tue passioni per il mondo dei TCG!
  
  ━━━━━━━━━━━━━━━━━━━━━━
  
  🙏 Se hai domande, chiedi pure: il viaggio è appena iniziato!`;
        await chat.sendMessage(welcomeMsg, { mentions: [contact] });
      }
    }
    if (notification.action === 'remove') {
      for (const participant of notification.participants) {
        const contact = await client.getContactById(participant);
        const addioMsg =
`╭━━━━━━━━━━━━━━━━━━━━━━━━╮
│  👋  *Addio Allenatore!*  👋  │
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
@${contact.id.user} ha lasciato la Lega Pokémon.
Che il viaggio continui, e che tu possa trovare sempre nuovi Pokémon! 🍃✨`;
        await chat.sendMessage(addioMsg, { mentions: [contact] });
      }
    }
  }
});
client.on('message', async message => {
  const chat = await message.getChat();
  if (!chat.isGroup) return;
  const groupId = chat.id._serialized;

  if (groupId === ANIME_GROUP_ID) {
    await handleAdminGroup(message, chat, { filtroBestemmie: true });
    return;
  }
  if (groupId === POKEMON_GROUP_ID) {
    await handleAdminGroup(message, chat, { filtroBestemmie: false });
    return;
  }
  if (groupId === CAZZATA_GROUP_ID) {
    await handleCazzata(message, chat);
    return;
  }
  if (groupId === PROVABOT_GROUP_ID) {
    await handleAdminGroup(message, chat, { filtroBestemmie: true });
    await handleCazzata(message, chat);
    return;
  }
});

// =======================
// LOGICA GRUPPI AMMINISTRATIVI (anime, pokemon, provabot)
// =======================
async function handleAdminGroup(message, chat, { filtroBestemmie = true } = {}) {
  const userId = message.author || message.from;
  const msg = message.body.trim().toLowerCase();

  // --- Filtro parole bandite lista locale ---
  if (contieneParolaBanditaLocale(message.body)) {
    await message.delete(true);
    await message.reply(
`★彡[ MODERAZIONE ]彡★
✖️ Messaggio cancellato!
🚫 Parola non consentita

Questo gruppo vuole essere uno spazio accogliente per tutti.
Ti chiediamo di evitare certi termini e di contribuire a mantenere un clima positivo!
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`
    );
    return;
  }

  // --- Filtro bestemmie (solo se attivo) ---
  if (filtroBestemmie && contieneBestemmia(message.body)) {
    await message.delete(true);
    await message.reply(
`★彡[ MODERAZIONE ]彡★
✖️ Messaggio cancellato!
⚠️ Bestemmia rilevata

Nel rispetto di tutti i membri, ti chiediamo di non usare bestemmie.
Continuiamo a parlare e a divertirci insieme!
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`
    );
    return;
  }

  // --- Filtro "cundo" e varianti ---
  if (contieneCundo(message.body)) {
    await message.delete(true);
    await message.reply(
`★彡[ MODERAZIONE ]彡★
✖️ Messaggio cancellato!
🚫 Termine non adatto

Evitiamo certi termini e manteniamo un ambiente sereno per tutti!
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`
    );
    return;
  }

  if (utentiMutati.has(userId)) {
    await message.delete(true);
    return;
  }

  // --- Anti-spam messaggi identici ---
  if (message.type === 'chat' && !msg.startsWith('!')) {
    const last = lastMessageMap.get(userId) || { text: '', count: 0 };
    if (last.text === message.body) {
      last.count += 1;
      if (last.count > MAX_IDENTICAL) {
        await message.delete(true);
        await message.reply(
`★彡[ MODERAZIONE ]彡★
✖️ Messaggio cancellato!
🛑 Spam rilevato

Per favore, evita di ripetere lo stesso messaggio più volte.
Così la chat resta ordinata e piacevole per tutti i membri!
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`
        );
        return;
      }
    } else {
      last.text = message.body;
      last.count = 1;
    }
    lastMessageMap.set(userId, last);
  } else if (message.type === 'chat') {
    lastMessageMap.set(userId, { text: message.body, count: 1 });
  }

  if (message.type === 'sticker') {
    const stickerCount = (lastStickerMap.get(userId) || 0) + 1;
    lastStickerMap.set(userId, stickerCount);
  } else {
    lastStickerMap.set(userId, 0);
  }

  // --- ANTI-SPAM STICKER DI UTENTE (10 sticker in 20 secondi dallo stesso utente) ---
  if (chat.isGroup && message.type === 'sticker') {
    const isUserAdmin = await isAdmin(message);
    if (!isUserAdmin) {
      const now = Date.now();
      const key = `${chat.id._serialized}_${userId}`;
      let timestamps = userStickerTimestamps[key] || [];
      timestamps = timestamps.filter(ts => now - ts <= STICKER_SPAM_WINDOW);
      timestamps.push(now);
      userStickerTimestamps[key] = timestamps;

      if (timestamps.length === STICKER_SPAM_LIMIT) {
        await message.delete(true);
        if (!gruppiStickerBloccati.has(chat.id._serialized)) {
          await chat.setMessagesAdminsOnly(true);
          gruppiStickerBloccati.add(chat.id._serialized);
          const admins = chat.participants.filter(p => p.isAdmin);
          const adminContacts = await Promise.all(admins.map(a => client.getContactById(a.id._serialized)));
          const mentions = adminContacts;
          await chat.sendMessage(
`🚨🚨🚨
★彡[𝑨𝑳𝑳𝑬𝑹𝑻 𝑺𝑻𝑰𝑪𝑲𝑬𝑹 𝑺𝑷𝑨𝑴]彡★
Troppi sticker inviati! Solo gli admin possono scrivere.
Usate *!sbloccagruppo* per sbloccare.
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`, { mentions }
          );
          setTimeout(async () => {
            gruppiStickerBloccati.delete(chat.id._serialized);
            await chat.setMessagesAdminsOnly(false);
            await chat.sendMessage('✅ Il gruppo è stato sbloccato automaticamente dopo 5 minuti.');
          }, STICKER_BLOCK_DURATION);
        }
        return;
      }
      if (timestamps.length > STICKER_SPAM_LIMIT) {
        await message.delete(true);
        return;
      }
    }
  }
  // --- !ban ---
  if (msg.startsWith('!ban')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da bannare.');
    }
    const userToBan = mentionedIds[0];
    try {
      const contact = await client.getContactById(userToBan);
      await chat.removeParticipants([userToBan]);
      if (warnCount.has(userToBan)) {
        warnCount.delete(userToBan);
        saveWarns();
      }
      await chat.sendMessage(`@${contact.id.user} è stato bannato.`, { mentions: [contact] });
      return;
    } catch (err) {
      return message.reply('❌ Non sono riuscito a bannare l’utente.');
    }
  }

  // --- !warn @utente ---
  if (msg.startsWith('!warn')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da ammonire.');
    }
    const userToWarn = mentionedIds[0];
    let count = parseInt(warnCount.get(userToWarn) || '0', 10);
    count++;
    warnCount.set(userToWarn, count);
    saveWarns();
    const contactWarned = await client.getContactById(userToWarn);
    if (count >= 3) {
      try {
        await chat.removeParticipants([userToWarn]);
        warnCount.delete(userToWarn);
        saveWarns();
        return message.reply(`🚨 Utente ${contactWarned.pushname || contactWarned.number} bannato automaticamente dopo 3 warn.`);
      } catch (err) {
        return message.reply('❌ Non sono riuscito a bannare l’utente dopo i warn.');
      }
    } else {
      return message.reply(`⚠️ ${contactWarned.pushname || contactWarned.number} ammonito (${count}/3). Al terzo warn sarà bannato.`);
    }
  }

  // --- !autospam @utente ---
  if (msg.startsWith('!autospam')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da autorizzare.');
    }
    const userToAuthorize = mentionedIds[0];
    autorizzatiSpam.add(userToAuthorize);
    const contact = await client.getContactById(userToAuthorize);
    return message.reply(`✅ ${contact.pushname || contact.number} ora può inviare link social.`);
  }

  // --- !delspam @utente ---
  if (msg.startsWith('!delspam')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da rimuovere dall’autorizzazione.');
    }
    const userToRemove = mentionedIds[0];
    autorizzatiSpam.delete(userToRemove);
    const contact = await client.getContactById(userToRemove);
    return message.reply(`🔒 ${contact.pushname || contact.number} non può più inviare link social.`);
  }

  // --- !mute @utente ---
  if (msg.startsWith('!mute')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da silenziare.');
    }
    const userToMute = mentionedIds[0];
    utentiMutati.add(userToMute);
    const contact = await client.getContactById(userToMute);
    return message.reply(`🔇 ${contact.pushname || contact.number} è stato silenziato.`);
  }

  // --- !unmute @utente ---
  if (msg.startsWith('!unmute')) {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const mentionedIds = message.mentionedIds || [];
    if (mentionedIds.length === 0) {
      return message.reply('❌ Devi menzionare un utente da desilenziare.');
    }
    const userToUnmute = mentionedIds[0];
    utentiMutati.delete(userToUnmute);
    const contact = await client.getContactById(userToUnmute);
    return message.reply(`🔊 ${contact.pushname || contact.number} può di nuovo scrivere.`);
  }

  // --- !bloccagruppo ---
  if (msg === '!bloccagruppo') {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    await chat.setMessagesAdminsOnly(true);
    return message.reply('🔒 Il gruppo è stato bloccato: solo gli admin possono scrivere!');
  }

  // --- !sbloccagruppo ---
  if (msg === '!sbloccagruppo') {
    if (!await isAdmin(message)) {
      return message.reply('❌ Solo admin possono usare questo comando.');
    }
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    await chat.setMessagesAdminsOnly(false);
    gruppiStickerBloccati.delete(chat.id._serialized);
    return message.reply('✅ Il gruppo è stato sbloccato, ora tutti possono scrivere!');
  }

  // --- !info ---
  if (msg === '!info') {
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    let description = chat.description || "Nessuna descrizione";
    let admins = chat.participants.filter(p => p.isAdmin).length;
    return message.reply(
`╭━━━[ ℹ️ 𝑰𝑵𝑭𝑶 𝑮𝑹𝑼𝑷𝑷𝑶 ]━━━╮
┃ Nome: ${chat.name}
┃ Membri: ${chat.participants.length}
┃ Admin: ${admins}
┃ Tema: Anime & Manga
┃ Descrizione:
┃ ${description}
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    );
  }

  // --- !listadmin ---
  if (msg === '!listadmin') {
    if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
    const admins = chat.participants.filter(p => p.isAdmin);
    const adminContacts = await Promise.all(admins.map(a => client.getContactById(a.id._serialized)));
    const adminList = adminContacts.map(c => `• @${c.id.user} (${c.pushname || c.number})`).join('\n');
    return chat.sendMessage(
      `👮‍♂️ *Admin del gruppo:*\n${adminList}`,
      { mentions: adminContacts }
    );
  }

  // --- !ping ---
  if (msg === '!ping') {
    const t0 = Date.now();
    const reply = await message.reply('🏓 Pong!');
    const t1 = Date.now();
    setTimeout(() => {
      reply.reply(`⏱️ Risposta in ${t1 - t0} ms`);
    }, 100);
    return;
  }

  // --- !reminder [minuti] [testo] ---
  if (msg.startsWith('!reminder')) {
    const args = message.body.trim().split(' ');
    if (args.length < 3) {
      return message.reply('⏰ Uso: !reminder [minuti] [testo]');
    }
    const minuti = parseInt(args[1]);
    if (isNaN(minuti) || minuti < 1 || minuti > 1440) {
      return message.reply('⏰ Inserisci un numero di minuti valido (1-1440).');
    }
    const testo = args.slice(2).join(' ');
    await message.reply(`⏰ Promemoria impostato tra ${minuti} minuti! Ti scriverò in privato.`);
    setTimeout(async () => {
      try {
        const contact = await client.getContactById(userId);
        await contact.sendMessage(`⏰ *Promemoria!* \n${testo}`);
      } catch (e) {
        await message.reply(`⏰ *Promemoria per @${userId.split('@')[0]}:* \n${testo}`, { mentions: [await client.getContactById(userId)] });
      }
    }, minuti * 60 * 1000);
    return;
  }

  // --- !aiuto ---
  if (msg === '!aiuto') {
    return message.reply(
`╔═════════════════════╗
║  📖 *COMANDI BOT* 📖  ║
╚═════════════════════╝
!regole   • Mostra le regole
!citazione • Citazione anime
!discord • Link Discord
!ban @   • Banna utente (admin)
!warn @  • Ammonisci utente (admin)
!autospam @utente • Autorizza link social (admin)
!delspam @utente • Rimuovi autorizzazione link social (admin)
!mute @utente • Silenzia un utente (admin)
!unmute @utente • Desilenzia un utente (admin)
!bloccagruppo • Solo admin, blocca il gruppo
!sbloccagruppo • Solo admin, sblocca il gruppo
!info • Info gruppo
!listadmin • Lista admin
!ping • Test bot
!reminder [minuti] [testo] • Promemoria personale
✧･ﾟ: *✧･ﾟ:* 　　 *:･ﾟ✧*:･ﾟ✧
══════════════════════`
    );
  }

  // --- !regole ---
  if (msg === '!regole') {
    return message.reply(
`╔═[ 📜 𝑹𝑬𝑮𝑶𝑳𝑬 𝑨𝑵𝑰𝑴𝑬/𝑷𝑶𝑲𝑬𝑴𝑶𝑵 ]═╗
1. Rispetto per tutti
2. No spoiler senza avviso!
3. Vietato NSFW
4. Parla solo di anime/manga/pokémon
5. Vietato spammare sticker
6. Vietato insultare o bestemmiare (solo anime)
╚═════════════════════╝`
    );
  }

  // --- !citazione ---
  if (msg === '!citazione') {
    const citazioni = [
      `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"Power comes in response to a need, not a desire." — Goku`,
      `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"Forgetting is like a wound. The wound may heal, but it has already left a scar." — Luffy`,
      `╭──────────────╮\n│  ✨ 𝑪𝑰𝑻𝑨𝒁𝑰𝑶𝑵𝑬 ✨  │\n╰──────────────╯\n"A lesson without pain is meaningless." — Edward Elric`
    ];
    const rand = Math.floor(Math.random() * citazioni.length);
    return message.reply(citazioni[rand]);
  }

  // --- !discord ---
  if (msg === '!discord') {
    return message.reply(
      `🔗 Unisciti al nostro server Discord:\nhttps://discord.gg/xCR6WcWrG5`
    );
  }
}
client.initialize();
