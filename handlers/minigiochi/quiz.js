const { addPoints, addMoney, getUserData, loadData } = require('./gameManager');
const quizQuestions = require('./quizQuestions'); // Importa le domande

// Carica dati all'avvio
loadData();

// Stato quiz in corso (per semplicità, un quiz alla volta)
let currentQuiz = null;

// Inizia un quiz
async function startQuiz(chat, client) {
  if (currentQuiz) {
    await chat.sendMessage('Un quiz è già in corso! Rispondi alla domanda attuale.');
    return;
  }
  const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  currentQuiz = { question, chatId: chat.id._serialized };
  let msg = `Quiz! Rispondi con la lettera corretta:\n${question.question}\n`;
  question.options.forEach(opt => { msg += opt + '\n'; });
  await chat.sendMessage(msg);
}

// Gestisci risposta
async function handleAnswer(message, chat, client) {
  if (!currentQuiz || chat.id._serialized !== currentQuiz.chatId) return false;
  const userAnswer = message.body.trim().toUpperCase();
  if (userAnswer === currentQuiz.question.answer) {
    const userId = message.author || message.from;
    addPoints(userId, 10); // 10 punti per risposta corretta
    addMoney(userId, 5);   // 5 monete per risposta corretta
    await chat.sendMessage(
      `Bravo @${userId.split('@')[0]}! Risposta corretta. Hai guadagnato 10 punti e 5 monete.`,
      { mentions: [await client.getContactById(userId)
] }
    );
    currentQuiz = null;
    return true;
  } else {
    await chat.sendMessage('Risposta sbagliata, riprova!');
    return true;
  }
}

module.exports = { startQuiz, handleAnswer };
