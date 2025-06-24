# 🎌 SuzakuBot 2.0 - Guida Completa

## 📋 Indice
- [Introduzione](#introduzione)
- [Caratteristiche](#caratteristiche)
- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Primo Avvio](#primo-avvio)
- [Comandi Disponibili](#comandi-disponibili)
- [Risoluzione Problemi](#risoluzione-problemi)
- [Manutenzione](#manutenzione)

## 🎯 Introduzione

**SuzakuBot 2.0** è la versione completamente ricostruita del bot WhatsApp per gruppi anime/manga. Questa versione include numerosi miglioramenti rispetto all'originale:

- ✅ Sistema di autenticazione più stabile
- ✅ Gestione avanzata degli errori
- ✅ Sistema di logging completo
- ✅ Backup automatici
- ✅ Rate limiting integrato
- ✅ Riconnessione automatica
- ✅ Configurazione semplificata

## 🌟 Caratteristiche

### 🛡️ Moderazione Avanzata
- **Anti-spam intelligente**: Rileva messaggi ripetuti e spam di sticker
- **Filtro bestemmie**: Sistema avanzato con pattern recognition
- **Auto-mute temporaneo**: Silenzia automaticamente gli utenti problematici
- **Controllo link**: Gestione autorizzazioni per la condivisione di link

### 👮‍♂️ Amministrazione Gruppi
- **Sistema di warn**: 3 avvertimenti = ban automatico
- **Gestione utenti**: Ban, mute, unmute con menzioni
- **Controllo gruppo**: Blocca/sblocca messaggi per tutti
- **Lista admin**: Visualizza tutti gli amministratori del gruppo

### 🎮 Minigiochi
- **Quiz anime/manga**: Domande con punteggio e monete virtuali
- **Sistema punti**: Classifica utenti più attivi
- **Statistiche gioco**: Tracking delle performance

### 🎉 Funzionalità Extra
- **Messaggi di benvenuto**: Accoglienza automatica per nuovi membri
- **Citazioni anime**: Database di citazioni famose
- **Easter eggs**: Risposte divertenti a parole chiave
- **Promemoria**: Sistema di reminder personalizzati

## 📋 Requisiti

### Sistema
- **Node.js**: versione 18.0.0 o superiore
- **npm**: versione 8.0.0 o superiore
- **Sistema operativo**: Windows, macOS, o Linux
- **RAM**: Minimo 512MB, raccomandati 1GB
- **Spazio disco**: Almeno 100MB liberi

### WhatsApp
- Account WhatsApp attivo
- Numero di telefono verificato
- WhatsApp Web accessibile dal browser

## 🚀 Installazione

### 1. Scarica il Codice
```bash
# Clona o scarica il repository
git clone https://github.com/jnkfrost/suzakubot-improved
cd suzakubot-improved
```

### 2. Installa le Dipendenze
```bash
# Installa tutti i pacchetti necessari
npm install

# Verifica che tutto sia installato correttamente
npm run test
```

### 3. Crea le Cartelle Necessarie
```bash
# Il bot creerà automaticamente queste cartelle, ma puoi crearle manualmente
mkdir logs
mkdir backups
mkdir session
```

## ⚙️ Configurazione

### 1. File di Configurazione
Copia il file `.env.example` in `.env`:
```bash
cp .env.example .env
```

Modifica il file `.env` con le tue impostazioni:
```env
# Impostazioni del Bot
BOT_NAME=SuzakuBot
NODE_ENV=production

# ID Admin (IMPORTANTE: Inserisci il tuo numero WhatsApp)
ADMIN_PHONE=39xxxxxxxxxx@c.us

# Impostazioni Moderazione
ANTI_SPAM_ENABLED=true
ANTI_BESTEMMIE_ENABLED=true
AUTO_BAN_AFTER_WARNS=3
```

### 2. Configurazione Gruppi
Modifica il file `config/groups.js` con gli ID dei tuoi gruppi:
```javascript
module.exports = {
    ANIME_GROUP: "120xxxxxxxxxxxxx@g.us",
    MANGA_GROUP: "120xxxxxxxxxxxxx@g.us",
    POKEMON_GROUP: "120xxxxxxxxxxxxx@g.us"
};
```

**Come ottenere l'ID di un gruppo:**
1. Avvia il bot in modalità debug: `npm run dev`
2. Invia un messaggio nel gruppo desiderato
3. Controlla i log - apparirà l'ID del gruppo

### 3. Personalizzazione Comandi
Puoi modificare i comandi nei file della cartella `handlers/`:
- `admingroup.js` - Comandi amministrazione
- `moderation.js` - Impostazioni moderazione
- `minigiochi/` - Configurazione giochi

## 🎬 Primo Avvio

### 1. Avvio del Bot
```bash
# Avvio in produzione
npm start

# Avvio in modalità sviluppo (con auto-restart)
npm run dev
```

### 2. Scansione QR Code
1. Il bot mostrerà un QR code nel terminale
2. Apri WhatsApp sul telefono
3. Vai su "Dispositivi collegati" > "Collega un dispositivo"
4. Scansiona il QR code mostrato nel terminale

### 3. Verifica il Funzionamento
Dopo la scansione:
- Il bot dovrebbe mostrare "✅ SuzakuBot è online e pronto!"
- Invia `!ping` in un gruppo configurato
- Dovresti ricevere una risposta "🏓 Pong!"

## 📖 Comandi Disponibili

### 👥 Comandi per Tutti
| Comando | Descrizione | Esempio |
|---------|-------------|---------|
| `!ping` | Testa se il bot è online | `!ping` |
| `!regole` | Mostra le regole del gruppo | `!regole` |
| `!info` | Informazioni sul gruppo | `!info` |
| `!citazione` | Citazione anime casuale | `!citazione` |
| `!discord` | Link al server Discord | `!discord` |
| `!aiuto` | Lista completa comandi | `!aiuto` |
| `!reminder [min] [testo]` | Imposta promemoria | `!reminder 30 Studiare` |

### 🎮 Comandi Giochi
| Comando | Descrizione | Esempio |
|---------|-------------|---------|
| `!quiz` | Avvia quiz anime/manga | `!quiz` |
| `!punti` | Mostra i tuoi punti | `!punti` |
| `!classifica` | Top 10 giocatori | `!classifica` |
| `!monete` | Saldo monete virtuali | `!monete` |

### 👮‍♂️ Comandi Admin
| Comando | Descrizione | Esempio |
|---------|-------------|---------|
| `!ban @utente` | Banna un utente | `!ban @mario` |
| `!warn @utente` | Ammonisce un utente | `!warn @mario` |
| `!mute @utente` | Silenzia un utente | `!mute @mario` |
| `!unmute @utente` | Togli silenzio | `!unmute @mario` |
| `!bloccagruppo` | Solo admin possono scrivere | `!bloccagruppo` |
| `!sbloccagruppo` | Tutti possono scrivere | `!sbloccagruppo` |
| `!listadmin` | Lista amministratori | `!listadmin` |
| `!autospam @utente` | Autorizza link social | `!autospam @mario` |
| `!delspam @utente` | Rimuovi autorizzazione | `!delspam @mario` |

## 🔧 Risoluzione Problemi

### ❌ Problema: QR Code Non Appare
**Soluzioni:**
1. Verifica che il terminale supporti i caratteri Unicode
2. Prova a usare un terminale diverso (CMD, PowerShell, Terminal)
3. Controlla la connessione internet
4. Riavvia il bot: `Ctrl+C` poi `npm start`

### ❌ Problema: Bot Non Risponde
**Soluzioni:**
1. Verifica che il gruppo sia configurato in `config/groups.js`
2. Controlla i log: `npm run logs`
3. Verifica che il bot sia admin del gruppo (per alcune funzioni)
4. Testa con `!ping` in privato

### ❌ Problema: Errori di Autenticazione
**Soluzioni:**
1. Elimina la cartella `.wwebjs_auth`
2. Riavvia il bot e scansiona di nuovo il QR
3. Verifica che WhatsApp Web funzioni nel browser
4. Controlla che il numero WhatsApp sia attivo

### ❌ Problema: Bot Si Disconnette Spesso
**Soluzioni:**
1. Verifica la stabilità della connessione internet
2. Aggiorna WhatsApp sul telefono
3. Controlla i log per errori specifici
4. Considera l'uso di un VPS invece del PC personale

### ❌ Problema: Comandi Non Funzionano
**Verifiche:**
1. Il messaggio inizia con `!`? 
2. Il comando è scritto correttamente?
3. L'utente ha i permessi necessari?
4. Il gruppo è autorizzato?

## 🛠️ Manutenzione

### 📊 Monitoraggio
```bash
# Visualizza log in tempo reale
npm run logs

# Controlla statistiche bot (solo admin)
# Invia !stats in WhatsApp

# Controlla stato sistema
htop  # Linux/Mac
taskmgr  # Windows
```

### 💾 Backup
```bash
# Backup manuale
npm run backup

# I backup automatici vengono creati ogni 6 ore
# Posizione: ./backups/backup-TIMESTAMP.json
```

### 🔄 Aggiornamenti
```bash
# Aggiorna dipendenze
npm run update-deps

# Verifica vulnerabilità
npm audit

# Aggiorna Node.js se necessario
node --version  # Controlla versione attuale
```

### 🧹 Pulizia
```bash
# Pulisci log vecchi
npm run clean-logs

# Rimuovi backup vecchi (il bot tiene automaticamente gli ultimi 7)
# Controlla manualmente la cartella ./backups/
```

## 📝 Log e Debug

### Tipologie di Log
- **Info** 📘: Operazioni normali
- **Success** ✅: Operazioni completate
- **Warning** ⚠️: Situazioni da monitorare  
- **Error** ❌: Errori da risolvere
- **Debug** 🔍: Informazioni dettagliate

### Controllo Log
```bash
# Ultimi 50 messaggi
tail -50 logs/bot.log

# Log in tempo reale
tail -f logs/bot.log

# Cerca errori specifici
grep "ERROR" logs/bot.log

# Log moderazione
cat logs/moderation.log
```

## 🆘 Supporto

### Prima di Chiedere Aiuto
1. ✅ Controlla questa guida
2. ✅ Verifica i log per errori
3. ✅ Prova le soluzioni comuni
4. ✅ Aggiorna all'ultima versione

### Dove Chiedere Aiuto
- **GitHub Issues**: Per bug e richieste funzionalità
- **Discord**: Per supporto in tempo reale
- **Telegram**: Gruppo di supporto utenti

### Informazioni da Fornire
Quando chiedi aiuto, includi sempre:
- Sistema operativo
- Versione Node.js (`node --version`)
- Messaggio di errore completo
- Log relevanti
- Passi per riprodurre il problema

---

## 🎯 Note Finali

**SuzakuBot 2.0** è progettato per essere affidabile e facile da usare. Se segui questa guida passo dopo passo, dovresti avere il bot funzionante senza problemi.

Ricorda:
- 🔄 Tieni sempre aggiornate le dipendenze
- 💾 Controlla periodicamente i backup
- 📊 Monitora i log per eventuali problemi
- 🛡️ Configura correttamente la moderazione

**Buon utilizzo! 🚀**

---

*Versione guida: 2.0.0 | Ultimo aggiornamento: Giugno 2025*