#!/usr/bin/env node

/**
 * Script di controllo stato SuzakuBot 2.0
 * Verifica lo stato del bot e genera un report
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;

    return result || '0m';
}

function checkHealthStatus() {
    console.log('🔍 SuzakuBot 2.0 - Controllo Stato Sistema');
    console.log('==========================================');
    console.log();

    // 1. Informazioni sistema
    console.log('💻 Sistema:');
    console.log(`   OS: ${os.type()} ${os.release()}`);
    console.log(`   Architettura: ${os.arch()}`);
    console.log(`   CPU: ${os.cpus()[0].model}`);
    console.log(`   Memoria totale: ${formatBytes(os.totalmem())}`);
    console.log(`   Memoria libera: ${formatBytes(os.freemem())}`);
    console.log(`   Uptime sistema: ${formatUptime(os.uptime())}`);
    console.log();

    // 2. Node.js
    console.log('🟢 Node.js:');
    console.log(`   Versione: ${process.version}`);
    console.log(`   Memoria usata: ${formatBytes(process.memoryUsage().heapUsed)}`);
    console.log(`   Memoria totale heap: ${formatBytes(process.memoryUsage().heapTotal)}`);
    console.log(`   Uptime processo: ${formatUptime(process.uptime())}`);
    console.log();

    // 3. File di configurazione
    console.log('⚙️  Configurazione:');

    const configFiles = [
        { name: '.env', required: true },
        { name: 'config/groups.js', required: true },
        { name: 'package.json', required: true },
        { name: 'index.js', required: true }
    ];

    configFiles.forEach(file => {
        if (fs.existsSync(file.name)) {
            const stats = fs.statSync(file.name);
            console.log(`   ✅ ${file.name} (${formatBytes(stats.size)})`);
        } else {
            console.log(`   ❌ ${file.name} ${file.required ? '(RICHIESTO)' : '(opzionale)'}`);
        }
    });
    console.log();

    // 4. Cartelle
    console.log('📁 Cartelle:');

    const dirs = ['logs', 'backups', 'handlers', 'config'];
    dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).length;
            console.log(`   ✅ ${dir}/ (${files} file)`);
        } else {
            console.log(`   ❌ ${dir}/`);
        }
    });
    console.log();

    // 5. Dipendenze
    console.log('📦 Dipendenze:');

    if (fs.existsSync('node_modules')) {
        console.log('   ✅ node_modules/ trovata');

        if (fs.existsSync('package-lock.json')) {
            console.log('   ✅ package-lock.json presente');
        } else {
            console.log('   ⚠️  package-lock.json mancante');
        }
    } else {
        console.log('   ❌ node_modules/ mancante - esegui: npm install');
    }
    console.log();

    // 6. Log recenti
    console.log('📋 Log:');

    if (fs.existsSync('logs/bot.log')) {
        const stats = fs.statSync('logs/bot.log');
        const content = fs.readFileSync('logs/bot.log', 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        console.log(`   ✅ bot.log (${formatBytes(stats.size)}, ${lines.length} righe)`);

        // Mostra ultimi 3 log
        if (lines.length > 0) {
            console.log('   Ultimi log:');
            lines.slice(-3).forEach(line => {
                if (line.trim()) {
                    console.log(`     ${line.substring(0, 80)}...`);
                }
            });
        }
    } else {
        console.log('   ⚠️  Nessun file di log trovato');
    }
    console.log();

    // 7. Backup
    console.log('💾 Backup:');

    if (fs.existsSync('backups')) {
        const backups = fs.readdirSync('backups')
            .filter(file => file.startsWith('backup-'))
            .sort()
            .reverse();

        if (backups.length > 0) {
            console.log(`   ✅ ${backups.length} backup trovati`);
            console.log(`   Ultimo backup: ${backups[0]}`);
        } else {
            console.log('   ⚠️  Nessun backup trovato');
        }
    } else {
        console.log('   ❌ Cartella backup mancante');
    }
    console.log();

    // 8. Stato generale
    const issues = [];

    if (!fs.existsSync('.env')) issues.push('File .env mancante');
    if (!fs.existsSync('config/groups.js')) issues.push('Configurazione gruppi mancante');
    if (!fs.existsSync('node_modules')) issues.push('Dipendenze non installate');

    console.log('🏥 Stato Generale:');
    if (issues.length === 0) {
        console.log('   ✅ Tutto OK! Il bot dovrebbe funzionare correttamente.');
    } else {
        console.log('   ⚠️  Problemi trovati:');
        issues.forEach(issue => console.log(`     - ${issue}`));
    }
    console.log();

    console.log('ℹ️  Per avviare il bot: npm start');
    console.log('ℹ️  Per vedere i log: npm run logs');
    console.log('ℹ️  Per supporto: leggi la guida completa');
}

// Esegui controllo
checkHealthStatus();
