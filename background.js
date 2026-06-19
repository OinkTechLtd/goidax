chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.notifications.create({
      title: 'Добро пожаловать в GoidaX!',
      message: 'Нажмите на центральную кнопку для активации обхода блокировок. Лимит 60 минут.',
      iconUrl: 'icon.png',
      type: 'basic'
    });
  } else if (details.reason === 'update') {
    // Update message
  }
});

let activeTimer = null;
let dnsServers = [
  { name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
  { name: 'Google', primary: '8.8.8.8', secondary: '8.8.4.4' },
  // Add more foreign hard-to-block
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activate') {
    // Simulate DNS change - in reality, instruct user or use proxy
    chrome.proxy.settings.set({
      value: {
        mode: 'pac_script',
        pacScript: {
          data: 'function FindProxyForURL(url, host) { return "DIRECT"; }' // Placeholder, can be enhanced
        }
      },
      scope: 'regular'
    }, () => {
      console.log('Proxy/DNS simulation activated');
    });

    const endTime = Date.now() + 60 * 60 * 1000;
    chrome.storage.local.set({ bypassEndTime: endTime });

    if (activeTimer) clearInterval(activeTimer);
    activeTimer = setInterval(() => {
      const now = Date.now();
      if (now > endTime) {
        deactivateBypass();
      }
    }, 10000);

    sendResponse({ success: true });
  } else if (message.action === 'deactivate') {
    deactivateBypass();
    sendResponse({ success: true });
  } else if (message.action === 'getTime') {
    chrome.storage.local.get('bypassEndTime', (data) => {
      sendResponse({ endTime: data.bypassEndTime });
    });
    return true;
  }
});

function deactivateBypass() {
  chrome.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' });
  chrome.storage.local.remove('bypassEndTime');
  if (activeTimer) clearInterval(activeTimer);
  chrome.notifications.create({
    title: 'GoidaX',
    message: 'Сессия обхода завершена. Активируйте заново.',
    type: 'basic'
  });
}

// GitHub Actions for updating DNS list can be set up separately
console.log('GoidaX background loaded');