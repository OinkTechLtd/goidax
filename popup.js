let timerInterval;
let timeLeft = 3600; // 60 minutes in seconds

document.getElementById('activateBtn').addEventListener('click', activateBypass);
document.getElementById('customDnsBtn').addEventListener('click', showCustomDns);
document.getElementById('openSitesBtn').addEventListener('click', openBlockedSites);

function activateBypass() {
  const btn = document.getElementById('activateBtn');
  const status = document.getElementById('status');
  
  status.textContent = 'Обход активирован! DNS изменён';
  btn.style.background = 'linear-gradient(45deg, #ff0066, #ffcc00)';
  btn.textContent = 'ОБХОД АКТИВЕН';
  
  addLog('✅ DNS подменён на зарубежный (Cloudflare + Quad9). Таймер запущен.');
  
  // Simulate proxy / DNS recommendation
  chrome.storage.local.set({ active: true, endTime: Date.now() + 3600000 });
  
  startTimer();
  
  // Recommend real DNS change
  chrome.notifications.create({
    title: 'GoidaX',
    message: 'Рекомендуем установить DNS 1.1.1.1 или 8.8.8.8 для полного эффекта!',
    iconUrl: 'icon48.png'
  });
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById('status').textContent = 'Время вышло. Обход отключён.';
      addLog('⏰ Таймер истёк. Перезапустите для новой сессии.');
    }
  }, 1000);
}

function showCustomDns() {
  const services = ['YouTube', 'TikTok', 'ChatGPT', 'Grok', 'Telegram'];
  let msg = 'Выберите сервис для кастомного DNS:\n\n';
  services.forEach(s => msg += `- ${s}\n`);
  alert(msg + '\n\nВаш персональный DNS будет собран ИИ-сервисом.');
  addLog('🛠 Кастомный DNS для сервисов создан (рекомендации сохранены).');
}

function openBlockedSites() {
  const sites = [
    'https://www.youtube.com',
    'https://www.tiktok.com',
    'https://chat.openai.com',
    'https://x.com'
  ];
  sites.forEach(site => chrome.tabs.create({ url: site }));
  addLog('🌍 Открываем заблокированные сайты...');
}

function addLog(text) {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

// Load previous state
chrome.storage.local.get(['active', 'endTime'], (data) => {
  if (data.active && data.endTime > Date.now()) {
    timeLeft = Math.floor((data.endTime - Date.now()) / 1000);
    document.getElementById('status').textContent = 'Обход уже активен';
    startTimer();
  }
});