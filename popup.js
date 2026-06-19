let timerInterval;

document.getElementById('activateBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'activate' }, (response) => {
    if (response.success) {
      document.getElementById('status').textContent = 'Обход АКТИВЕН! Сайты открываются.';
      startTimer();
    }
  });
});

document.getElementById('customBtn').addEventListener('click', () => {
  const dns = prompt('Введите primary DNS (например 1.1.1.1):');
  if (dns) {
    alert(`Ваш DNS: ${dns}. Настройте в настройках ОС или браузера.`);
    // Save to storage
    chrome.storage.local.set({ customDNS: dns });
  }
});

document.getElementById('sitesBtn').addEventListener('click', () => {
  const sites = ['https://www.youtube.com', 'https://www.tiktok.com', 'https://chat.openai.com'];
  sites.forEach(site => chrome.tabs.create({ url: site }));
});

function startTimer() {
  chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
    if (response.endTime) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((response.endTime - Date.now()) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (remaining <= 0) {
          clearInterval(timerInterval);
          document.getElementById('status').textContent = 'Сессия завершена';
        }
      }, 1000);
    }
  });
}

// On load
chrome.runtime.sendMessage({ action: 'getTime' }, (response) => {
  if (response.endTime && Date.now() < response.endTime) {
    startTimer();
    document.getElementById('status').textContent = 'Обход АКТИВЕН!';
  }
});

chrome.runtime.onInstalled.addListener for uninstall? But limited in extension.