const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fetch = require('node-fetch');
const axios = require('axios');

const API_NINJAS_KEY = 'yGiJUay7mAOTF5jVkEk3Cg==eMMzlEnECxwjEj0k
';

console.log('🚀 Avvio bot...');

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
const STICKER_BLOCK_DURATION = 5 * 60 * 1000; // 5 minuti

// --- Normalizza doppioni/tripli lettere ---
function normalizzaDoppioni(text) {
  return text.replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ@!|0-9])\1{1,}/gi, '$1');
}

// --- Filtro bestemmie ---
const bestemmie = [
  "dio", "madonna", "gesu", "cristo", "maria", "giuseppe"
];

function contieneBestemmia(text) {
  const lower = text.toLowerCase().replace(/[^a-zàèéìòù\s]/gi, '');
  return bestemmie.some(b => {
    const regex = new RegExp(`\\bporc[oa]?\\s*${b}\\b|\\b${b}\\s*porc[oa]?\\b`, 'i');
    return regex.test(lower);
  });
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

// --- Lista locale parole bandite (con varianti, confini di parola, controllo doppioni) ---
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
  return paroleBanditeRegex.some(re => re.test(cleanText) || re.test(normalizzato));
}

// --- Filtro parole bandite via API Ninjas ---
async function contieneParolaBanditaAPI(text) {
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/profanityfilter', {
      params: { text },
      headers: { 'X-Api-Key': API_NINJAS_KEY }
    });
    return response.data.has_profanity;
  } catch (e) {
    console.error('Errore filtro API:', e.message);
    return false;
  }
}

const lastMessageMap = new Map();
const lastStickerMap = new Map();
const MAX_IDENTICAL = 2;
const MAX_STICKER = 1;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot attivo!');
});

client.on('group_participants_changed', async (notification) => {
  const chat = await notification.getChat();

  // Messaggio di benvenuto
  if (notification.action === 'add') {
    for (const participant of notification.participants) {
      const contact = await client.getContactById(participant);
      const welcomeMsg =
`🎉 *Benvenut* nel gruppo, @${contact.id.user}!*

🧡 Raccontaci un po’ di te:
• Nome & Età
• Da dove vieni?

🤍 Qual è il tuo anime, manga, serie TV o film preferito?

💙 Siamo felici di averti qui, buona permanenza!  
🎧 (Ricorda di mutare il gruppo perchè  parliamo troppo!)

⚠️ *Importante:*  
Leggi con attenzione le regole 👉 https://rentry.co/tbgmyb8h  
Per mantenere il gruppo un posto piacevole per tutti!

---

🙏 Se hai domande, non esitare a chiedere!`;
      await chat.sendMessage(welcomeMsg, {
        mentions: [contact]
      });
    }
  }

  // Messaggio di addio con foto profilo (per chi esce da solo o viene rimosso manualmente)
  if (notification.action === 'remove') {
    for (const participant of notification.participants) {
      const contact = await client.getContactById(participant);
      const profilePicUrl = await client.getProfilePicUrl(participant);
      let media;
      if (profilePicUrl) {
        const response = await fetch(profilePicUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        media = new MessageMedia('image/jpeg', base64, 'profile.jpg');
      }
      const addioMsg = `👋 Addio @${contact.id.user}`;
      if (media) {
        await chat.sendMessage(media, {
          caption: addioMsg,
          mentions: [contact]
        });
      } else {
        await chat.sendMessage(addioMsg, { mentions: [contact] });
      }
    }
  }
});

async function isAdmin(message) {
  const chat = await message.getChat();
  if (!chat.isGroup) return false;
  const userId = message.author || message.from;
  const participant = chat.participants.find(p => p.id._serialized === userId);
  return participant ? participant.isAdmin : false;
}

client.on('message', async message => {
  try {
    const msg = message.body.trim().toLowerCase();
    const chat = await message.getChat();
    const userId = message.author || message.from;

    // --- Filtro parole bandite: API o lista locale ---
    if (await contieneParolaBanditaAPI(message.body) || contieneParolaBanditaLocale(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene parole non consentite.');
      return;
    }

    // --- Filtro bestemmie ---
    if (contieneBestemmia(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene bestemmie.');
      return;
    }

    // --- Filtro "cundo" e varianti ---
    if (contieneCundo(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene termini non consentiti.');
      return;
    }

    if (utentiMutati.has(userId)) {
      await message.delete(true);
      return;
    }

    if (message.type === 'chat' && !msg.startsWith('!')) {
      const last = lastMessageMap.get(userId) || { text: '', count: 0 };
      if (last.text === message.body) {
        last.count += 1;
        if (last.count > MAX_IDENTICAL) {
          await message.delete(true);
          await message.reply('🚫 Non spammare messaggi identici!');
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
      if (stickerCount > MAX_STICKER) {
        lastStickerMap.set(userId, stickerCount);
      } else {
        lastStickerMap.set(userId, stickerCount);
      }
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

        if (gruppiStickerBloccati.has(chat.id._serialized)) {
          await message.delete(true);
          return;
        }

        if (timestamps.length >= STICKER_SPAM_LIMIT) {
          await message.delete(true);
          if (!gruppiStickerBloccati.has(chat.id._serialized)) {
            await chat.setMessagesAdminsOnly(true);
            gruppiStickerBloccati.add(chat.id._serialized);
            const admins = chat.participants.filter(p => p.isAdmin);
            const adminContacts = await Promise.all(admins.map(a => client.getContactById(a.id._serialized)));
            const mentions = adminContacts;
            await chat.sendMessage(
              `🚨 Il gruppo è stato bloccato per spam di sticker (10 di seguito da un utente in 20 secondi)! Solo gli admin possono scrivere. Gli admin possono sbloccare il gruppo con !sbloccagruppo.`,
              { mentions }
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

    // --- (Resto dei comandi: ban, warn, mute, unmute, autospam, delspam, bloccagruppo, sbloccagruppo, info, listadmin, ping, reminder, aiuto, regole, citazione, sondaggio, discord, admin) ---
    // (Puoi lasciare qui tutti i comandi già presenti, non vanno toccati!)

    // --- !ban ---
    if (msg.startsWith('!ban')) {
      if (!await isAdmin(message)) {
        return message.reply('❌ Solo admin possono usare questo comando.');
      }
      if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
      if (mentionedIds.length === 0) {
        return message.reply('❌ Devi menzionare un utente da bannare.');
      }
      const userToBan = mentionedIds[0];
      try {
        const contact = await client.getContactById(userToBan);
        const profilePicUrl = await client.getProfilePicUrl(userToBan);
        let media;
        if (profilePicUrl) {
          const response = await fetch(profilePicUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          media = new MessageMedia('image/jpeg', base64, 'profile.jpg');
        }
        const addioMsg = `👋 Addio @${contact.id.user}`;
        if (media) {
          await chat.sendMessage(media, {
            caption: addioMsg,
            mentions: [contact]
          });
        } else {
          await chat.sendMessage(addioMsg, { mentions: [contact] });
        }
        await chat.removeParticipants([userToBan]);
        if (warnCount.has(userToBan)) {
          warnCount.delete(userToBan);
          saveWarns();
        }
        return;
      } catch (err) {
        return message.reply('❌ Non sono riuscito a bannare l’utente.');
      }
    }

    // ... (tutti gli altri comandi invariati, come nelle versioni precedenti) ...

  } catch (error) {
    console.error('Errore nel listener message:', error);
  }
});

client.initialize();
