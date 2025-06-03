import {GROUP_IDS} from "./config";

const client = require('./client');
const qrcode = require('qrcode-terminal');
const messageRouter = require('./handlers/messageHandler');
const scheduler = require('./scheduler');
import OpenAI from "openai";
const openAI = new OpenAI();
const apiKey = process.env.OPENAI_API_KEYY;


// QR Code
client.on('qr', qr => qrcode.generate(qr, { small: true }));

// Quando il bot è pronto
client.on('ready', async () => {
  console.log('✅ Bot attivo!');
  const response = await openAI.responses.create({
    model: "gpt-4.1-nano",
    instructions: "Sei un bot in un gruppo di Anime, Gamers ecc... Parla come un'annunciatrice",
    input: "Saluta le persone del gruppo presentandoti in modo breve e dando un caloroso saluto. Breve 4 righe max",
  })
  await client.sendMessage(
      GROUP_IDS.ANIME,
      response.output_text
  );
  scheduler.setup(client);
});

// Gestione messaggi
client.on('message', async message => {
  const chat = await message.getChat();
  if (!chat.isGroup) return;
  await messageRouter(message, chat);
});

client.initialize();
