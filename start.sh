#!/bin/bash
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
