const { ANIME_GROUP_ID, POKEMON_GROUP_ID } = require('../config/groups');

/**
 * Gestisce i messaggi di benvenuto e addio nei gruppi specifici.
 * @param {object} chat - Oggetto Chat di WhatsApp Web.js
 * @param {object} client - Istanza del client WhatsApp
 * @param {string} participantId - ID del partecipante
 * @param {string} action - 'add' per join, 'remove' per leave
 */
async function handleWelcome(chat, client, participantId, action) {
  const groupId = chat.id._serialized;

  if (action === 'add') {
    const contact = await client.getContactById(participantId);

    if (groupId === ANIME_GROUP_ID) {
      const welcomeMsg = `╔════════════════════════════╗
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

    if (groupId === POKEMON_GROUP_ID) {
      const welcomeMsg = `━━━━━━━━━━━━━━━━━━━━━━
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

  if (action === 'remove') {
    const contact = await client.getContactById(participantId);

    if (groupId === ANIME_GROUP_ID) {
      const addioMsg = `╭───────────────────╮
│  👋  *Addio*  👋  │
╰───────────────────╯
@${contact.id.user} ha lasciato il gruppo.`;
      await chat.sendMessage(addioMsg, { mentions: [contact] });
    }

    if (groupId === POKEMON_GROUP_ID) {
      const addioMsg = `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
│  👋  *Addio Allenatore!*  👋  │
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
@${contact.id.user} ha lasciato la Lega Pokémon.
Che il viaggio continui, e che tu possa trovare sempre nuovi Pokémon! 🍃✨`;
      await chat.sendMessage(addioMsg, { mentions: [contact] });
    }
  }
}

module.exports = { handleWelcome };
