const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Import dei moduli del bot
const { handleAdminGroup } = require('./handlers/admingroup');
const { handleModeration } = require('./handlers/moderation');
const { handleWelcome } = require('./handlers/welcome');
const { handleEasterEggs } = require('./handlers/eastereggs');
const { handleCazzata } = require('./handlers/cazzata');
const { handleMinigiochi } = require('./handlers/minigiochi/gameManager');
const groups = require('./config/groups');

// Configurazione e inizializzazione
const SESSION_FILE_PATH = './session.json';
let sessionCfg;

// Carica sessione se esiste
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

// Configurazione client WhatsApp con persistenza sessione
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Sistema di logging migliorato
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleString('it-IT');
    const logTypes = {
        info: '📘',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        debug: '🔍'
    };

    console.log(`[${timestamp}] ${logTypes[type] || logTypes.info} ${message}`);

    // Scrivi anche su file di log
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    fs.appendFileSync('./logs/bot.log', logEntry);
}

// Assicura che la cartella logs esista
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Gestione eventi del client
client.on('qr', (qr) => {
    log('QR Code ricevuto! Scansiona con il tuo telefono:', 'info');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    log('✨ SuzakuBot è online e pronto! ✨', 'success');
    log(`Bot connesso come: ${client.info.pushname}`, 'info');
    log(`Numero WhatsApp: ${client.info.wid.user}`, 'info');
});

client.on('authenticated', () => {
    log('Autenticazione completata con successo!', 'success');
});

client.on('auth_failure', msg => {
    log(`Errore di autenticazione: ${msg}`, 'error');
});

client.on('disconnected', (reason) => {
    log(`Client disconnesso: ${reason}`, 'warning');
    log('Tentativo di riconnessione...', 'info');

    // Riavvia il client dopo un breve delay
    setTimeout(() => {
        client.initialize();
    }, 5000);
});

// Gestione errori globali
process.on('unhandledRejection', (reason, promise) => {
    log(`Errore non gestito: ${reason}`, 'error');
});

process.on('uncaughtException', (error) => {
    log(`Eccezione non catturata: ${error.message}`, 'error');
});

// Variabili per il rate limiting
const userMessageCount = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 20;

// Funzione per il rate limiting
function checkRateLimit(userId) {
    const now = Date.now();
    const userMessages = userMessageCount.get(userId) || [];

    // Rimuovi messaggi più vecchi della finestra
    const recentMessages = userMessages.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentMessages.length >= MAX_MESSAGES_PER_WINDOW) {
        return false; // Rate limit superato
    }

    recentMessages.push(now);
    userMessageCount.set(userId, recentMessages);
    return true;
}

// Gestione messaggi principali
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const userId = message.from;

        // Ignora messaggi dal bot stesso
        if (message.fromMe) return;

        // Rate limiting
        if (!checkRateLimit(userId)) {
            log(`Rate limit superato per utente: ${userId}`, 'warning');
            return;
        }

        // Controllo se il messaggio è in un gruppo autorizzato
        if (chat.isGroup) {
            const groupId = chat.id._serialized;
            const authorizedGroups = Object.values(groups);

            if (!authorizedGroups.includes(groupId)) {
                log(`Messaggio ignorato da gruppo non autorizzato: ${groupId}`, 'debug');
                return;
            }
        }

        log(`Messaggio ricevuto da ${message.author || userId}: ${message.body}`, 'debug');

        // Gestione moduli in ordine di priorità

        // 1. Moderazione (sempre prima)
        const moderationHandled = await handleModeration(message, client);
        if (moderationHandled) return;

        // 2. Comandi admin e gestione gruppi
        const adminHandled = await handleAdminGroup(message, client);
        if (adminHandled) return;

        // 3. Minigiochi
        const gameHandled = await handleMinigiochi(message, client);
        if (gameHandled) return;

        // 4. Benvenuto (solo per nuovi membri)
        if (message.type === 'notification_template' && message.body.includes('added')) {
            await handleWelcome(message, client);
            return;
        }

        // 5. Easter eggs
        const easterEggHandled = await handleEasterEggs(message, client);
        if (easterEggHandled) return;

        // 6. Funzioni casuali
        await handleCazzata(message, client);

    } catch (error) {
        log(`Errore nella gestione del messaggio: ${error.message}`, 'error');
        console.error(error.stack);

        // Invia messaggio di errore all'utente (opzionale)
        try {
            await message.reply('❌ Si è verificato un errore interno. Riprova più tardi.');
        } catch (replyError) {
            log(`Errore nell'invio della risposta di errore: ${replyError.message}`, 'error');
        }
    }
});

// Gestione nuovi membri nel gruppo
client.on('group_join', async (notification) => {
    try {
        await handleWelcome(notification, client);
    } catch (error) {
        log(`Errore nella gestione del nuovo membro: ${error.message}`, 'error');
    }
});

// Funzione di backup periodico dei dati
function backupData() {
    try {
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

        // Backup dei dati importanti (warns, punti, ecc.)
        const backupData = {
            timestamp: new Date().toISOString(),
            // Qui aggiungeresti i dati da fare backup
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        log(`Backup completato: ${backupFile}`, 'info');

        // Mantieni solo gli ultimi 7 backup
        const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('backup-'))
            .sort()
            .reverse();

        if (backupFiles.length > 7) {
            backupFiles.slice(7).forEach(file => {
                fs.unlinkSync(path.join(backupDir, file));
                log(`Backup vecchio eliminato: ${file}`, 'debug');
            });
        }

    } catch (error) {
        log(`Errore nel backup: ${error.message}`, 'error');
    }
}

// Backup automatico ogni 6 ore
setInterval(backupData, 6 * 60 * 60 * 1000);

// Statistiche bot
let botStats = {
    messagesProcessed: 0,
    commandsExecuted: 0,
    errorsEncountered: 0,
    startTime: new Date()
};

// Comando per statistiche (solo per admin)
client.on('message', async (message) => {
    if (message.body === '!stats' && message.from.includes('admin')) { // Modifica con l'ID admin
        const uptime = Date.now() - botStats.startTime.getTime();
        const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

        const statsMessage = `📊 **Statistiche SuzakuBot**
⏰ Online da: ${uptimeHours}h ${uptimeMinutes}m
📨 Messaggi processati: ${botStats.messagesProcessed}
⚡ Comandi eseguiti: ${botStats.commandsExecuted}  
❌ Errori riscontrati: ${botStats.errorsEncountered}
💾 Memoria utilizzata: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`;

        await message.reply(statsMessage);
    }
});

// Funzione di graceful shutdown
process.on('SIGINT', () => {
    log('Ricevuto segnale di interruzione, chiudendo il bot...', 'warning');

    // Backup finale prima della chiusura
    backupData();

    client.destroy().then(() => {
        log('Bot chiuso correttamente!', 'success');
        process.exit(0);
    }).catch((error) => {
        log(`Errore nella chiusura: ${error.message}`, 'error');
        process.exit(1);
    });
});

// Inizializza il client
log('🚀 Avvio SuzakuBot...', 'info');
client.initialize();
