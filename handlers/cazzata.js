// cazzata.js

/**
 * Handler per i comandi e le risposte speciali del gruppo CAZZATA.
 * Espandi pure la lista dei comandi come preferisci!
 */
async function handleCazzata(message, chat) {
  const msg = message.body.trim().toLowerCase();

  // Comando !dio (bestemmia "fantasiosa" NON offensiva)
  if (msg === '!dio') {
    const bestemmieFantasiose = [
      "Porco Zeus e tutti gli dei dell'Olimpo!",
      "Dio porco in Ferrari turbo!",
      "Madonna volante su un unicorno!",
      "Gesù che gioca a Pokémon!",
      "Porca Maria in skateboard!",
      "San Giuseppe che fa breakdance!",
      "Cristo ninja delle tenebre!",
      "Madonna con la katana!",
      "Dio che mangia ramen con Goku!",
      "Porco Buddha in bicicletta!",
      "Porco Allah che si fa un mojito con Maometto!",
      "Dio e Satana che fanno la morra cinese a chi bestemmia meglio!",
      "Gesù che bestemmia perché gli si è rotto il crocifisso IKEA!",
      "Porco Odino e i suoi corvi ubriachi!",
      "Madonna che twerka al Vaticano!",
      "Dio che si fa selfie con Lucifero!",
      "Cristo che bestemmia perché ha perso a Mario Kart!",
      "Porco Shiva che balla la Macarena!",
      "Madonna che fa cosplay da Sailor Moon!",
      "Gesù che bestemmia guardando One Piece filler!"
    ];
    const scelta = bestemmieFantasiose[Math.floor(Math.random() * bestemmieFantasiose.length)];
    await message.reply(
      `★彡[ 𝑩𝑬𝑺𝑻𝑬𝑴𝑴𝑰𝑨 𝑭𝑨𝑵𝑻𝑨𝑺𝑰𝑶𝑺𝑨 ]彡★\n${scelta}`
    );
    return;
  }

  // Comando !cazzata (risposta casuale nonsense)
  if (msg === '!cazzata') {
    const risposte = [
      "La banana quantistica è in ritardo per il tè.",
      "Se il cactus suona il violino, piove latte di soia.",
      "Ho visto un piccione che programmava in C++.",
      "Oggi il sole ha dimenticato di mettere la crema.",
      "I pixel sono i mattoncini della realtà.",
      "Un unicorno ha vinto il Nobel per la pace.",
      "La tastiera sogna pecore elettriche.",
      "La gravità oggi è in sciopero.",
      "Il WiFi del frigorifero è più veloce del mio.",
      "Se ascolti bene, puoi sentire il silenzio gridare."
    ];
    const scelta = risposte[Math.floor(Math.random() * risposte.length)];
    await message.reply(scelta);
    return;
  }

  // Easter egg: se qualcuno scrive "cazzata" nella frase
  if (/cazzata/i.test(message.body)) {
    await message.react('💩');
    return;
  }

  // Puoi aggiungere altri comandi personalizzati qui!
}

module.exports = { handleCazzata };
// Questo file gestisce i comandi e le risposte speciali del gruppo CAZZATA.