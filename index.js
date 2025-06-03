const { GROUP_IDS } = require('./config');

const client = require('./client');
const qrcode = require('qrcode-terminal');
const messageRouter = require('./handlers/messageHandler');
const scheduler = require('./scheduler');
const OpenAI = require("openai");
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



// QR Code
client.on('qr', qr => qrcode.generate(qr, { small: true }));

// Quando il bot è pronto
client.on('ready', async () => {
  console.log('Bot attivo!');

  try {
    const response = await openAI.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: "Sei un bot in un gruppo di Anime e Gamers. Parla come un'annunciatrice!"
        },
        {
          role: 'user',
          content: 'Saluta il gruppo presentandoti in modo caloroso. Breve, massimo 4 righe.'
        }
      ]
    });

    await client.sendMessage(GROUP_IDS.ANIME, response.choices[0].message.content);
  } catch (err) {
    console.error('Errore OpenAI:', err.message);
  }

  // Attiva messaggi schedulati
  scheduler.setup(client);
});

// Gestione messaggi
client.on('message', async message => {
  const chat = await message.getChat();
  if (!chat.isGroup) return;
  await messageRouter(message, chat);
});

client.initialize();
