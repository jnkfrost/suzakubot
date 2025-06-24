// handlers/minigiochi/gameManager.js

const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../../data/gameData.json');

let gameData = {};
let filterEnabled = true; // Stato iniziale: filtro attivo

// Carica dati da file
function loadData() {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    try {
      gameData = JSON.parse(raw);
      // Carica stato filtro se presente, altrimenti usa default
      filterEnabled = gameData.settings?.filterEnabled !== undefined 
        ? gameData.settings.filterEnabled 
        : true;
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
  // Includi lo stato del filtro nei dati da salvare
  const dataToSave = {
    ...gameData,
    settings: {
      filterEnabled
    }
  };
  fs.writeFileSync(dataFilePath, JSON.stringify(dataToSave, null, 2));
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

// Gestione stato filtro
function setFilterEnabled(status) {
  filterEnabled = status;
  saveData();
}

function isFilterEnabled() {
  return filterEnabled;
}

// Carica i dati all'avvio
loadData();

module.exports = {
  loadData,
  saveData,
  addPoints,
  addMoney,
  getUserData,
  setFilterEnabled,
  isFilterEnabled
};
