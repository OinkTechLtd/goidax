chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.notifications.create({
      title: 'Добро пожаловать в GoidaX!',
      message: 'Нажми большую кнопку для активации обхода. Удачи в разблокировке!',
      iconUrl: 'icon48.png'
    });
  }
});

chrome.runtime.onSuspend.addListener(() => {
  chrome.notifications.create({
    title: 'GoidaX',
    message: 'До встречи! Рекомендуем вернуться через 30 дней за обновлениями.',
    iconUrl: 'icon48.png'
  });
});

// Proxy config simulation (real DNS change still manual)
chrome.proxy.settings.set({
  value: {
    mode: 'pac_script',
    pacScript: {
      data: 'function FindProxyForURL(url, host) { return "DIRECT"; }'
    }
  }
});