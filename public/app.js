// SuzakuBot 2.0 Dashboard JavaScript

// Application data from JSON
const appData = {
  "botStatus": {
    "online": true,
    "uptime": "2d 14h 32m",
    "messagesProcessed": 15742,
    "activeGroups": 3,
    "moderatedUsers": 28
  },
  "weeklyActivity": [
    {"day": "Lun", "messages": 1200},
    {"day": "Mar", "messages": 1400},
    {"day": "Mer", "messages": 1100},
    {"day": "Gio", "messages": 1600},
    {"day": "Ven", "messages": 1800},
    {"day": "Sab", "messages": 2200},
    {"day": "Dom", "messages": 1900}
  ],
  "recentEvents": [
    {"time": "14:32", "type": "info", "message": "Nuovo membro aggiunto al gruppo Anime"},
    {"time": "14:28", "type": "warning", "message": "Utente @mario ammonito per spam"},
    {"time": "14:15", "type": "success", "message": "Quiz completato da @luigi - 8/10 risposte corrette"},
    {"time": "14:02", "type": "error", "message": "Tentativo di invio link non autorizzato bloccato"},
    {"time": "13:45", "type": "info", "message": "Backup automatico completato"}
  ],
  "statistics": {
    "totalUsers": 156,
    "activeUsers": 89,
    "totalCommands": 3420,
    "popularCommands": [
      {"name": "!quiz", "count": 542},
      {"name": "!citazione", "count": 389},
      {"name": "!regole", "count": 276},
      {"name": "!info", "count": 198},
      {"name": "!ping", "count": 167}
    ],
    "moderation": {
      "messagesDeleted": 234,
      "warnsGiven": 67,
      "bansExecuted": 8,
      "mutesApplied": 23
    },
    "minigiochi": {
      "quizCompleted": 89,
      "pointsAwarded": 1456,
      "topPlayers": [
        {"name": "Naruto_Fan", "points": 287},
        {"name": "OnePiece_King", "points": 245},
        {"name": "AnimeOtaku", "points": 198},
        {"name": "MangaReader", "points": 167},
        {"name": "SuzakuFan", "points": 134}
      ]
    }
  },
  "groups": [
    {"id": "120xxxxx1@g.us", "name": "Anime Paradise", "members": 67, "active": true},
    {"id": "120xxxxx2@g.us", "name": "Manga Central", "members": 52, "active": true},
    {"id": "120xxxxx3@g.us", "name": "Pokemon Masters", "members": 37, "active": true}
  ],
  "logs": [
    {"time": "2025-06-19 14:32:15", "level": "info", "message": "Nuovo membro aggiunto al gruppo"},
    {"time": "2025-06-19 14:28:43", "level": "warning", "message": "Rate limit applicato per utente 393331234567"},
    {"time": "2025-06-19 14:15:22", "level": "success", "message": "Quiz completato con successo"},
    {"time": "2025-06-19 14:02:11", "level": "error", "message": "Errore nell'invio del messaggio: timeout"},
    {"time": "2025-06-19 13:45:33", "level": "info", "message": "Backup automatico creato: backup-20250619.json"}
  ],
  "backups": [
    {"file": "backup-20250619-143000.json", "date": "2025-06-19 14:30", "size": "2.3 MB"},
    {"file": "backup-20250619-083000.json", "date": "2025-06-19 08:30", "size": "2.1 MB"},
    {"file": "backup-20250618-203000.json", "date": "2025-06-18 20:30", "size": "2.0 MB"},
    {"file": "backup-20250618-143000.json", "date": "2025-06-18 14:30", "size": "1.9 MB"}
  ],
  "systemInfo": {
    "cpu": "45%",
    "ram": "67%",
    "disk": "23%",
    "nodeVersion": "20.11.1"
  }
};

// Global variables
let activityChart = null;
let currentSection = 'dashboard';
let refreshInterval = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();
  initializeDashboard();
  initializeLogs();
  initializeEventListeners();
  startAutoRefresh();
  updateBotStatus();
});

// Navigation functionality
function initializeNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      switchSection(section);
    });
  });
}

function switchSection(sectionName) {
  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
  
  // Update content sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionName).classList.add('active');
  
  currentSection = sectionName;
  
  // Initialize section-specific functionality
  if (sectionName === 'dashboard' && !activityChart) {
    initializeChart();
  }
}

// Dashboard initialization
function initializeDashboard() {
  updateStatusCards();
  updateRecentEvents();
  updateSystemMetrics();
  setTimeout(() => initializeChart(), 100);
}

function updateStatusCards() {
  document.getElementById('bot-status').textContent = appData.botStatus.online ? 'Online' : 'Offline';
  document.getElementById('messages-processed').textContent = appData.botStatus.messagesProcessed.toLocaleString();
  document.getElementById('active-groups').textContent = appData.botStatus.activeGroups;
  document.getElementById('moderated-users').textContent = appData.botStatus.moderatedUsers;
}

function updateRecentEvents() {
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '';
  
  appData.recentEvents.forEach(event => {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.innerHTML = `
      <span class="event-time">${event.time}</span>
      <div class="event-type ${event.type}"></div>
      <span class="event-message">${event.message}</span>
    `;
    eventsList.appendChild(eventElement);
  });
}

function updateSystemMetrics() {
  const cpuBar = document.querySelector('.metric:nth-child(1) .metric-fill');
  const ramBar = document.querySelector('.metric:nth-child(2) .metric-fill');
  
  if (cpuBar) cpuBar.style.width = appData.systemInfo.cpu;
  if (ramBar) ramBar.style.width = appData.systemInfo.ram;
}

// Chart initialization
function initializeChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  if (activityChart) {
    activityChart.destroy();
  }
  
  activityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: appData.weeklyActivity.map(day => day.day),
      datasets: [{
        label: 'Messaggi',
        data: appData.weeklyActivity.map(day => day.messages),
        borderColor: '#4f9eff',
        backgroundColor: 'rgba(79, 158, 255, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#ffffff'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

// Log functionality
function initializeLogs() {
  updateLogList();
  
  const logFilter = document.getElementById('log-filter');
  if (logFilter) {
    logFilter.addEventListener('change', filterLogs);
  }
}

function updateLogList(filter = 'all') {
  const logList = document.getElementById('log-list');
  if (!logList) return;
  
  logList.innerHTML = '';
  
  const filteredLogs = filter === 'all' 
    ? appData.logs 
    : appData.logs.filter(log => log.level === filter);
  
  filteredLogs.forEach(log => {
    const logElement = document.createElement('div');
    logElement.className = 'log-entry';
    logElement.innerHTML = `
      <span class="log-time">${log.time}</span>
      <span class="log-level ${log.level}">[${log.level.toUpperCase()}]</span>
      <span class="log-message">${log.message}</span>
    `;
    logList.appendChild(logElement);
  });
}

function filterLogs() {
  const filter = document.getElementById('log-filter').value;
  updateLogList(filter);
}

// Event listeners
function initializeEventListeners() {
  // Modal close
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      closeModal();
    }
  });
  
  // ESC key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Bot status update
function updateBotStatus() {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  
  if (appData.botStatus.online) {
    statusDot.style.backgroundColor = '#10b981';
    statusText.textContent = 'Online';
  } else {
    statusDot.style.backgroundColor = '#ef4444';
    statusText.textContent = 'Offline';
  }
}

// Utility functions
function refreshData() {
  showToast('Dati aggiornati con successo!');
  updateStatusCards();
  updateRecentEvents();
  updateSystemMetrics();
  if (activityChart) {
    activityChart.update();
  }
}

function saveConfiguration() {
  showModal(
    'Salva Configurazione',
    'Sei sicuro di voler salvare le modifiche alla configurazione?',
    () => {
      showToast('Configurazione salvata con successo!');
      closeModal();
    }
  );
}

function addGroup() {
  showToast('Funzione di aggiunta gruppo in sviluppo');
}

function downloadLogs() {
  const logData = appData.logs.map(log => `${log.time} [${log.level.toUpperCase()}] ${log.message}`).join('\n');
  const blob = new Blob([logData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suzakubot-logs-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Log scaricati con successo!');
}

function createBackup() {
  showModal(
    'Crea Backup',
    'Sei sicuro di voler creare un nuovo backup?',
    () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
      const filename = `backup-${timestamp[0]}-${timestamp[1].split('.')[0].replace(/-/g, '')}.json`;
      
      // Simulate backup creation
      appData.backups.unshift({
        file: filename,
        date: new Date().toLocaleString('it-IT'),
        size: '2.4 MB'
      });
      
      showToast('Backup creato con successo!');
      closeModal();
    }
  );
}

// Modal functions
function showModal(title, message, onConfirm) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirm = document.getElementById('modal-confirm');
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.add('active');
  
  modalConfirm.onclick = onConfirm;
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
}

// Toast functions
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Auto refresh functionality
function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    if (currentSection === 'dashboard') {
      // Simulate data updates
      appData.botStatus.messagesProcessed += Math.floor(Math.random() * 10) + 1;
      appData.systemInfo.cpu = Math.floor(Math.random() * 20 + 40) + '%';
      appData.systemInfo.ram = Math.floor(Math.random() * 20 + 60) + '%';
      
      updateStatusCards();
      updateSystemMetrics();
    }
  }, 30000); // 30 seconds
}

// Additional interactive functions
function restoreBackup(filename) {
  showModal(
    'Ripristina Backup',
    `Sei sicuro di voler ripristinare il backup ${filename}? Questa operazione sovrascriverà i dati attuali.`,
    () => {
      showToast('Backup ripristinato con successo!');
      closeModal();
    }
  );
}

function downloadBackup(filename) {
  showToast(`Download di ${filename} avviato`);
}

function removeGroup(groupName) {
  showModal(
    'Rimuovi Gruppo',
    `Sei sicuro di voler rimuovere il gruppo "${groupName}" dalla lista autorizzati?`,
    () => {
      showToast(`Gruppo "${groupName}" rimosso con successo!`);
      closeModal();
    }
  );
}

// Add event listeners for backup actions
document.addEventListener('click', function(e) {
  if (e.target.textContent === 'Scarica' && e.target.closest('.backup-item')) {
    const filename = e.target.closest('.backup-item').querySelector('.backup-file').textContent;
    downloadBackup(filename);
  }
  
  if (e.target.textContent === 'Ripristina' && e.target.closest('.backup-item')) {
    const filename = e.target.closest('.backup-item').querySelector('.backup-file').textContent;
    restoreBackup(filename);
  }
  
  if (e.target.textContent === 'Rimuovi' && e.target.closest('.group-item')) {
    const groupName = e.target.closest('.group-item').querySelector('.group-name').textContent;
    removeGroup(groupName);
  }
});

// Responsive sidebar toggle for mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

// Add mobile menu button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Create mobile menu button if screen is small
  if (window.innerWidth <= 768) {
    const header = document.querySelector('.header-content');
    const menuButton = document.createElement('button');
    menuButton.innerHTML = '☰';
    menuButton.className = 'mobile-menu-btn';
    menuButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 8px;
      display: block;
    `;
    menuButton.onclick = toggleSidebar;
    header.insertBefore(menuButton, header.firstChild);
  }
});

// Handle window resize
window.addEventListener('resize', function() {
  if (activityChart) {
    activityChart.resize();
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (activityChart) {
    activityChart.destroy();
  }
});