const fs = require('fs');
const { WARN_FILE_PATH } = require('../config');

let warnCount = new Map();

if (fs.existsSync(WARN_FILE_PATH)) {
    const data = fs.readFileSync(WARN_FILE_PATH);
    warnCount = new Map(Object.entries(JSON.parse(data)));
}

function saveWarns() {
    const obj = Object.fromEntries(warnCount);
    fs.writeFileSync(WARN_FILE_PATH, JSON.stringify(obj, null, 2));
}

module.exports = {
    warnCount,
    saveWarns
};
