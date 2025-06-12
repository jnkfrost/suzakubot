// index.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');

// === Importa configurazioni e handler ===
const {
  ANIME_GROUP_ID,
  POKEMON_GROUP_ID,
  CAZZATA_GROUP_ID,
  PROVABOT_GROUP_ID
} = require('./config/groups');

const { handleAdminGroup } = require('./handlers/admingroup');
const { handleCazzata } = require('./handlers/cazzata');
const { handleWelcome } = require('./handlers/welcome');
const { handleEasterEggs } = require('./handlers/eastereggs');
const { startQuiz, handleAnswer } = require('./handlers/minigiochi/quiz');
const { getUserData } = require('./handlers/minigiochi/gameManager');

// === Inizializza il client WhatsApp ===
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

// === QR Code per login WhatsApp ===
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// === Quando il bot è pronto ===
client.on('ready', async () => {
  console.log('🚀 Bot attivo e pronto!');
  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);

  // Log dei gruppi trovati
  groups.forEach(group => {
    console.log(`GRUPPO: ${group.name} | ID: ${group.id._serialized}`);
  });

  // Messaggi programmati per il gruppo anime
  schedule.scheduleJob('0 7 * * 1-5', async () => {
    await client.sendMessage(ANIME_GROUP_ID, 
`╭━☀️━━━━━━━☀️━╮
    𝑩𝒖𝒐𝒏𝒈𝒊𝒐𝒓𝒏𝒐 𝑵𝒂𝒌𝒂𝒎𝒂!
╰━☀️━━━━━━━☀️━╯
Svegliatevi e sorridete, è una nuova giornata!`);
  });

  schedule.scheduleJob('0 9 * * 6', async () => {
    await client.sendMessage(ANIME_GROUP_ID, 
`╭───────────────╮
│  🌈  *BUON SABATO!*  🌈  │
╰───────────────╯
Godetevi il weekend! 🎉`);
  });

  schedule.scheduleJob('0 9 * * 0', async () => {
    await client.sendMessage(ANIME_GROUP_ID, 
`╭───────────────╮
│  🌞  *BUONA DOMENICA!*  🌞  │
╰───────────────╯
Rilassatevi e divertitevi! 🥐`);
  });

  // Listener benvenuto/addio per ogni gruppo
  for (const chat of groups) {
    chat.on('participant_added', participant =>
      handleWelcome(chat, client, participant, 'add')
    );
    chat.on('participant_removed', participant =>
      handleWelcome(chat, client, participant, 'remove')
    );
  }
});

// === Gestione messaggi per ogni gruppo ===
client.on('message', async message => {
  const chat = await message.getChat();
  if (!chat.isGroup) return;
  const groupId = chat.id._serialized;
  const body = message.body.trim().toLowerCase();

  // Easter egg: se trovato, ferma qui
  if (await handleEasterEggs(message, chat)) return;

  // === QUIZ: comando per avviare un quiz ===
  if (body === '!quiz') {
    await startQuiz(chat, client);
    return;
  }
  // === QUIZ: gestione risposte ===
  if (await handleAnswer(message, chat, client)) return;

  // === Visualizza punti/monete utente ===
  if (body === '!punti' || body === '!soldi') {
    const userData = getUserData(message.author || message.from);
    await message.reply(
      `★彡[ SALDO ]彡★\n` +
      `Punti: ${userData.points}\n` +
      `Monete: ${userData.money}`
    );
    return;
  }

  // === Handler specifici per gruppo ===
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

// === Avvia il bot ===
client.initialize();
