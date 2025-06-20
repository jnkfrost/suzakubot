// admingroup.js

const fs = require('fs');
const schedule = require('node-schedule');
const { setFilterEnabled, isFilterEnabled } = require('./minigiochi/gameManager');

// === Variabili di stato ===
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

const lastMessageMap = new Map();
const lastStickerMap = new Map();
const MAX_IDENTICAL = 2;

// === Funzione di utilità ===
function normalizzaDoppioni(text) {
  return text.replace(/([a-zA-ZàèéìòùÀÈÉÌÒÙ@!|0-9])\1{1,}/gi, '$1');
}

// === Importa i filtri di moderazione dal modulo moderation.js ===
const {
  contieneBestemmia,
  contieneCundo,
  contieneParolaBanditaLocale
} = require('./moderation');

async function isAdmin(message) {
  const chat = await message.getChat();
  if (!chat.isGroup) return false;
  const userId = message.author || message.from;
  const participant = chat.participants.find(p => p.id._serialized === userId);
  return participant ? participant.isAdmin : false;
}

// === Funzione principale ===
async function handleAdminGroup(message, chat, { filtroBestemmie = true } = {}) {
  const userId = message.author || message.from;
  const msg = message.body.trim().toLowerCase();

  // === COMANDI GESTIONE FILTRO BESTEMMIE/PAROLE ===
  if (msg === '!filtro on' || msg === '!filtro off' || msg === '!filtro status') {
    if (!await isAdmin(message)) {
      await message.reply('❌ Solo admin possono usare questo comando.');
      return true;
    }
    if (msg === '!filtro on') {
      setFilterEnabled(true);
      await message.reply('🟢 Filtro bestemmie e parole ATTIVATO!');
      return true;
    }
    if (msg === '!filtro off') {
      setFilterEnabled(false);
      await message.reply('🔴 Filtro bestemmie e parole DISATTIVATO!');
      return true;
    }
    if (msg === '!filtro status') {
      await message.reply(isFilterEnabled() ? '🟢 Il filtro è ATTIVO.' : '🔴 Il filtro è DISATTIVATO.');
      return true;
    }
  }

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
          const adminContacts = await Promise.all(admins.map(a => chat.getContactById(a.id._serialized)));
          await chat.sendMessage(
`🚨🚨🚨
★彡[𝑨𝑳𝑳𝑬𝑹𝑻 𝑺𝑻𝑰𝑪𝑲𝑬𝑹 𝑺𝑷𝑨𝑴]彡★
Troppi sticker inviati! Solo gli admin possono scrivere.
Usate *!sbloccagruppo* per sbloccare.
⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻`, { mentions: adminContacts }
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

  // === COMANDI ADMIN E UTENTE ===

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
      await chat.removeParticipants([userToBan]);
      if (warnCount.has(userToBan)) {
        warnCount.delete(userToBan);
        saveWarns();
      }
      return message.reply(`@${userToBan.split('@')[0]} è stato bannato.`, { mentions: [await chat.getContactById(userToBan)] });
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
    const contactWarned = await chat.getContactById(userToWarn);
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
    const contact = await chat.getContactById(userToAuthorize);
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
    const contact = await chat.getContactById(userToRemove);
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
    const contact = await chat.getContactById(userToMute);
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
    const contact = await chat.getContactById(userToUnmute);
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
    const adminContacts = await Promise.all(admins.map(a => chat.getContactById(a.id._serialized)));
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
        const contact = await chat.getContactById(userId);
        await contact.sendMessage(`⏰ *Promemoria!* \n${testo}`);
      } catch (e) {
        await message.reply(`⏰ *Promemoria per @${userId.split('@')[0]}:* \n${testo}`, { mentions: [await chat.getContactById(userId)] });
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
`╔════════════[ 📜 𝑹𝑬𝑮𝑶𝑳𝑬 ]═══════════════════╗
1. Rispetto per tutti
2. No spoiler senza avviso!
3. Vietato NSFW
4. Parla solo di anime/manga/pokémon
5. Vietato spammare sticker
6. Vietato insultare o bestemmiare (solo anime)
╚══════════════════════════════════════════════╝`
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

module.exports = {
  handleAdminGroup,
  saveWarns
};
