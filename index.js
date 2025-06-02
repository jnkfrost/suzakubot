const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fetch = require('node-fetch');

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
  "cundo", "cunda", "cundi", "cunde",
  "bitch", "bitches",
  "fag", "fags", "faggot", "faggots",
  "nigger", "niggers", "nigga", "niggas",
  "whore", "whores",
  "suck dick", "sucks dick", "sucking dick", "suck my dick", "suck cocks", "suck cock",
  "foot licking", "foot licker", "lick my feet", "lick feet",
  "cum", "cumming", "cumshot"
];
const paroleBanditeRegex = paroleBanditeRaw.map(p => new RegExp(regexVariantiParola(p), 'i'));

const bestemmie = [
  "dio", "madonna", "gesu", "cristo", "maria", "giuseppe"
];

function contieneParolaBandita(text) {
  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9@!|àèéìòùÀÈÉÌÒÙ\s]/g, "");
  return paroleBanditeRegex.some(re => re.test(cleanText));
}

function contieneInsulto(text) {
  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9@!|àèéìòùÀÈÉÌÒÙ\s]/g, "");
  const insultiPattern = [
    /(sei|fai il|fate i|quanto sei|sei proprio un|odio|pezzo di|schifo)[\s:]+([a-z\s@!|0-9]+)?/,
  ];
  return paroleBanditeRegex.some(re => {
    return insultiPattern.some(pat => {
      const match = cleanText.match(pat);
      if (match && match[0]) {
        return re.test(match[0]);
      }
      return false;
    });
  });
}

function contieneBestemmia(text) {
  const lower = text.toLowerCase().replace(/[^a-zàèéìòù\s]/gi, '');
  return bestemmie.some(b => {
    const regex = new RegExp(`\\bporc[oa]?\\s*${b}\\b|\\b${b}\\s*porc[oa]?\\b`, 'i');
    return regex.test(lower);
  });
}

function containsSocialLink(text) {
  const socialRegex = /https?:\/\/([a-z0-9-]+\.)?(facebook|instagram|twitter|tiktokv|tiktokcdn|linkedin|youtube|x)\.com(\/[\w\-./?=&%#]*)?/i;
  if (socialRegex.test(text)) {
    const tiktokProfileRegex = /https?:\/\/([a-z0-9-]+\.)?tiktok\.com\/@[\w.-]+(\/)?(\s|$)/i;
    const tiktokVideoRegex = /https?:\/\/([a-z0-9-]+\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i;
    const tiktokShortVideo = /https?:\/\/(vm|vt)\.tiktok\.com\/[A-Za-z0-9]+/i;
    if (tiktokProfileRegex.test(text) && !tiktokVideoRegex.test(text)) {
      return true;
    }
    if (!/tiktok\.com/i.test(text)) return true;
    if (tiktokVideoRegex.test(text) || tiktokShortVideo.test(text)) return false;
    return false;
  }
  return false;
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

    if (contieneInsulto(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene insulti non consentiti.');
      return;
    }

    if (contieneParolaBandita(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene parole non consentite.');
      return;
    }

    if (contieneBestemmia(message.body)) {
      await message.delete(true);
      await message.reply('🚫 Questo messaggio è stato cancellato: contiene bestemmie.');
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
        await message.delete(true);
        await message.reply('🚫 Non spammare sticker uno dopo l’altro!');
        lastStickerMap.set(userId, stickerCount);
      } else {
        lastStickerMap.set(userId, stickerCount);
      }
    } else {
      lastStickerMap.set(userId, 0);
    }

    if (chat.isGroup && message.type === 'sticker') {
      const isUserAdmin = await isAdmin(message);
      if (!isUserAdmin) {
        const now = Date.now();
        const key = `${chat.id._serialized}_${userId}`;
        let timestamps = userStickerTimestamps[key] || [];
        timestamps = timestamps.filter(ts => now - ts <= STICKER_SPAM_WINDOW);
        timestamps.push(now);
        userStickerTimestamps[key] = timestamps;
        if (timestamps.length >= STICKER_SPAM_LIMIT) {
          await chat.setMessagesAdminsOnly(true);
          const admins = chat.participants.filter(p => p.isAdmin);
          const adminContacts = await Promise.all(admins.map(a => client.getContactById(a.id._serialized)));
          const mentions = adminContacts;
          const nomi = adminContacts.map(c => `@${c.id.user}`).join(' ');
          await chat.sendMessage(`🚨 Il gruppo è stato bloccato per spam di sticker (10 di seguito da @${userId.split('@')[0]} in 20 secondi)! Solo gli admin possono scrivere.\n${nomi}`, {
            mentions
          });
          userStickerTimestamps[key] = [];
          return;
        }
      }
    }

    if (containsSocialLink(message.body)) {
      if (chat.isGroup) {
        if (!autorizzatiSpam.has(userId)) {
          await message.delete(true);
          await message.reply('🚫 Non puoi inviare link di social senza autorizzazione degli admin. Usa !admin per chiedere il permesso.');
          return;
        }
      }
    }

    // !ban con messaggio di addio PRIMA della rimozione
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

    // --- !warn @utente ---
    if (msg.startsWith('!warn')) {
      if (!await isAdmin(message)) {
        return message.reply('❌ Solo admin possono usare questo comando.');
      }
      if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
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
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
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
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
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
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
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
      const mentionedIds = message.mentionedIds || message.mentionedJid || [];
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
      return message.reply('✅ Il gruppo è stato sbloccato, ora tutti possono scrivere!');
    }

    // --- !info ---
    if (msg === '!info') {
      if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
      let description = chat.description || "Nessuna descrizione";
      let admins = chat.participants.filter(p => p.isAdmin).length;
      return message.reply(
        `ℹ️ *Info gruppo*\n` +
        `Nome: ${chat.name}\n` +
        `Membri: ${chat.participants.length}\n` +
        `Admin: ${admins}\n` +
        `Descrizione: ${description}`
      );
    }

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

    if (msg === '!ping') {
      const t0 = Date.now();
      const reply = await message.reply('🏓 Pong!');
      const t1 = Date.now();
      setTimeout(() => {
        reply.reply(`⏱️ Risposta in ${t1 - t0} ms`);
      }, 100);
      return;
    }

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

    if (msg === '!aiuto') {
      return message.reply(
        `📖 Comandi disponibili:
!regole - Mostra le regole
!citazione - Citazione anime
!sondaggio - Avvia un sondaggio
!admin - Chiama gli admin
!discord - Link al server Discord
!ban @utente - Banna un utente (admin)
!warn @utente - Ammonisci un utente (admin)
!autospam @utente - Autorizza link social (admin)
!delspam @utente - Rimuovi autorizzazione link social (admin)
!mute @utente - Silenzia un utente (admin)
!unmute @utente - Desilenzia un utente (admin)
!bloccagruppo - Solo admin, blocca il gruppo
!sbloccagruppo - Solo admin, sblocca il gruppo
!info - Info gruppo
!listadmin - Lista admin
!ping - Test bot
!reminder [minuti] [testo] - Promemoria personale`
      );
    }

    if (msg === '!regole') {
      return message.reply(
        `📜 Regole del gruppo:
1. Rispetto per tutti
2. No spam o link sospetti
3. Vietato NSFW
4. Vietato inviare link social senza permesso admin
5. Vietato spammare sticker
6. Vietato insultare o bestemmiare`
      );
    }

    if (msg === '!citazione') {
      const citazioni = [
        '"Power comes in response to a need, not a desire." — Goku',
        '"Forgetting is like a wound. The wound may heal, but it has already left a scar." — Luffy',
        '"A lesson without pain is meaningless." — Edward Elric'
      ];
      const rand = Math.floor(Math.random() * citazioni.length);
      return message.reply(citazioni[rand]);
    }

    if (msg.startsWith('!sondaggio')) {
      return message.reply(
        `🗳️ Vuoi creare un sondaggio? Scrivi:
!sondaggio [Titolo]
E poi io ti guiderò.`
      );
    }

    if (msg === '!discord') {
      return message.reply(
        `🔗 Unisciti al nostro server Discord:
https://discord.gg/xCR6WcWrG5`
      );
    }

    if (msg === '!admin') {
      if (!chat.isGroup) return message.reply('❌ Comando disponibile solo nei gruppi.');
      const admins = chat.participants.filter(p => p.isAdmin);
