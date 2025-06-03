const schedule = require('node-schedule');
const { GROUP_IDS } = require('./config');

/**
 * Registra tutti i messaggi pianificati per i gruppi.
 * @param {Client} client - istanza di whatsapp-web.js
 */
function setup(client) {
    // Buongiorno nei giorni feriali (lun-ven alle 7:00)
    schedule.scheduleJob('0 7 * * 1-5', async function () {
        await client.sendMessage(
            GROUP_IDS.ANIME,
            `╭━☀️━━━━━━━☀️━╮
    𝑩𝒖𝒐𝒏𝒈𝒊𝒐𝒓𝒏𝒐 𝑵𝒂𝒌𝒂𝒎𝒂!
╰━☀️━━━━━━━☀️━╯
Svegliatevi e sorridete, è una nuova giornata!`
        );
    });

    // Sabato alle 9:00
    schedule.scheduleJob('0 9 * * 6', async function () {
        await client.sendMessage(
            GROUP_IDS.ANIME,
            `╭───────────────╮
│  🌈  *BUON SABATO!*  🌈  │
╰───────────────╯
Godetevi il weekend! 🎉`
        );
    });

    // Domenica alle 9:00
    schedule.scheduleJob('0 9 * * 0', async function () {
        await client.sendMessage(
            GROUP_IDS.ANIME,
            `╭───────────────╮
│  🌞  *BUONA DOMENICA!*  🌞  │
╰───────────────╯
Rilassatevi e divertitevi! 🥐`
        );
    });
}

module.exports = { setup };
