const client = require("../client");
const OpenAI = require("openai");
const openAI = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Funzione che genera una risposta usando OpenAI e la invia nella chat specificata.
 * @param {string} testoPrompt - Il prompt che vuoi passare a OpenAI (es: messaggio utente)
 * @param {object} chat - Oggetto Chat restituito da message.getChat()
 * @param {object} [options] - Opzioni (es: filtroBestemmie futuro)
 */
async function handleAiSentiment(testoPrompt, chat, options = {}) {
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
                    content: testoPrompt
                }
            ]
        });

        const risposta = response.choices[0].message.content;
        await client.sendMessage(chat.id._serialized, risposta);
    } catch (err) {
        console.error(' Errore OpenAI:', err.message);
    }
}

module.exports = handleAiSentiment;
