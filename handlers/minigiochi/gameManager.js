const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/gameData.json');

let gameData = {};

// Carica dati da file
function loadData() {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    try {
      gameData = JSON.parse(raw);
    } catch (e) {
      console.error('Errore caricando dati gioco:', e);
      gameData = {};
    }
  } else {
    gameData = {};
  }
}

// Salva dati su file
function saveData() {
  fs.writeFileSync(dataFilePath, JSON.stringify(gameData, null, 2));
}

// Inizializza dati utente se non esistono
function initUser(userId) {
  if (!gameData[userId]) {
    gameData[userId] = { points: 0, money: 0 };
  }
}

// Aggiungi punti a un utente
function addPoints(userId, points) {
  initUser(userId);
  gameData[userId].points += points;
  saveData();
}

// Aggiungi denaro a un utente
function addMoney(userId, amount) {
  initUser(userId);
  gameData[userId].money += amount;
  saveData();
}

// Ottieni dati utente
function getUserData(userId) {
  initUser(userId);
  return gameData[userId];
}

module.exports = {
  loadData,
  saveData,
  addPoints,
  addMoney,
  getUserData
};
