#!/usr/bin/env node

/**
 * Script di setup automatico per SuzakuBot 2.0
 * Questo script configura automaticamente l'ambiente per il bot
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colori per output terminale
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    log('🎌 Setup SuzakuBot 2.0', 'cyan');
    log('==============================', 'cyan');
    log('');
    
    try {
        // 1. Verifica Node.js
        log('📋 Verifico requisiti sistema...', 'blue');
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
        
        if (majorVersion < 18) {
            log(`❌ Node.js ${nodeVersion} trovato. Serve almeno Node.js 18.0.0`, 'red');
            process.exit(1);
        }
        
        log(`✅ Node.js ${nodeVersion} - OK`, 'green');
        
        // 2. Crea cartelle necessarie
        log('📁 Creo cartelle necessarie...', 'blue');
        const dirs = ['logs', 'backups', 'config', 'handlers', 'handlers/minigiochi'];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log(`  ✅ Creata cartella: ${dir}`, 'green');
            } else {
                log(`  ℹ️  Cartella esistente: ${dir}`, 'yellow');
            }
        });
        
        // 3. Configura file .env
        log('⚙️  Configurazione bot...', 'blue');
        
        if (!fs.existsSync('.env')) {
            const botName = await question('Nome del bot [SuzakuBot]: ') || 'SuzakuBot';
            const adminPhone = await question('Il tuo numero WhatsApp (es: 393331234567): ');
            
            if (!adminPhone || adminPhone.length < 10) {
                log('❌ Numero WhatsApp non valido', 'red');
                process.exit(1);
            }
            
            const envContent = `# Configurazione SuzakuBot
BOT_NAME=${botName}
BOT_VERSION=2.0.0
NODE_ENV=production

# Admin WhatsApp ID
ADMIN_PHONE=${adminPhone}@c.us

# Impostazioni Logging
LOG_LEVEL=info
LOG_TO_FILE=true
MAX_LOG_FILES=7

# Impostazioni Rate Limiting
RATE_LIMIT_WINDOW=60000
MAX_MESSAGES_PER_WINDOW=20

# Impostazioni Moderazione
ANTI_SPAM_ENABLED=true
ANTI_BESTEMMIE_ENABLED=true
AUTO_BAN_AFTER_WARNS=3

# Impostazioni Backup
AUTO_BACKUP=true
BACKUP_INTERVAL=21600000
MAX_BACKUP_FILES=7
`;
            
            fs.writeFileSync('.env', envContent);
            log('✅ File .env creato', 'green');
        } else {
            log('ℹ️  File .env già esistente', 'yellow');
        }
        
        // 4. Configura groups.js se non esiste
        if (!fs.existsSync('config/groups.js')) {
            const groupsContent = `// Configurazione gruppi autorizzati
// Per ottenere l'ID di un gruppo:
// 1. Avvia il bot in modalità debug: npm run dev
// 2. Invia un messaggio nel gruppo
// 3. Controlla i log per vedere l'ID del gruppo

module.exports = {
    // Inserisci qui gli ID dei tuoi gruppi
    ANIME_GROUP: "120xxxxxxxxxxxxx@g.us",
    MANGA_GROUP: "120xxxxxxxxxxxxx@g.us", 
    POKEMON_GROUP: "120xxxxxxxxxxxxx@g.us",
    
    // Aggiungi altri gruppi secondo necessità
    // GENERALE: "120xxxxxxxxxxxxx@g.us",
};

// IMPORTANTE: Dopo aver ottenuto gli ID reali,
// sostituisci i placeholder sopra con gli ID veri`;
            
            fs.writeFileSync('config/groups.js', groupsContent);
            log('✅ File config/groups.js creato', 'green');
        }
        
        // 5. Crea script di avvio
        const startScript = `#!/bin/bash
# Script di avvio per SuzakuBot 2.0

echo "🚀 Avvio SuzakuBot 2.0..."

# Verifica dipendenze
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
fi

# Avvia il bot
echo "✨ Avvio bot..."
npm start
`;
        
        fs.writeFileSync('start.sh', startScript);
        if (process.platform !== 'win32') {
            fs.chmodSync('start.sh', '755');
        }
        log('✅ Script di avvio creato', 'green');
        
        // 6. Verifica dipendenze
        log('📦 Verifico dipendenze...', 'blue');
        
        if (!fs.existsSync('node_modules')) {
            log('⚠️  Dipendenze non trovate. Esegui: npm install', 'yellow');
        } else {
            log('✅ Dipendenze trovate', 'green');
        }
        
        // 7. Mostra istruzioni finali
        log('', 'reset');
        log('🎉 Setup completato!', 'green');
        log('', 'reset');
        log('📝 Prossimi passi:', 'cyan');
        log('1. Modifica config/groups.js con gli ID dei tuoi gruppi', 'yellow');
        log('2. Installa dipendenze: npm install', 'yellow');
        log('3. Avvia il bot: npm start', 'yellow');
        log('4. Scansiona il QR code con WhatsApp', 'yellow');
        log('', 'reset');
        log('📖 Per informazioni dettagliate, leggi la guida completa.', 'blue');
        log('', 'reset');
        
    } catch (error) {
        log(`❌ Errore durante il setup: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Avvia setup
setup();
