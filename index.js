const { GROUP_IDS } = require('./config');

const client = require('./client');
const qrcode = require('qrcode-terminal');
const messageRouter = require('./handlers/messageHandler');
const handleAiSentiment = require('./handlers/handleAiSentiment');

const scheduler = require('./scheduler');




// QR Code
client.on('qr', qr => qrcode.generate(qr, { small: true }));



// Quando il bot è pronto
client.on('ready', async () => {
  console.log('Bot attivo!');
  const chat = await client.getChatById(GROUP_IDS.ANIME);
  await handleAiSentiment(
      "Saluta il gruppo presentandoti in modo caloroso. Breve, massimo 4 righe.",
      chat
  );

  // Attiva messaggi schedulati
  scheduler.setup(client);
});

// Gestione messaggi
client.on('message', async message => {
  const chat = await message.getChat();
  if (!chat.isGroup) return;

  if (message.body.toLowerCase().startsWith('!ai')) {
    const prompt = message.body.slice(3).trim(); // esempio: !ai Come va?
    if (!prompt) return message.reply('Scrivi qualcosa dopo `!ai` per generare una risposta.');
    await handleAiSentiment(prompt, chat);
    return;
  }
  await messageRouter(message, chat);
});

client.initialize();
