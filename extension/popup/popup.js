// Gloowroom Discord RPC - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const trackInfo = document.getElementById('trackInfo');
  const noTrack = document.getElementById('noTrack');
  const trackCover = document.getElementById('trackCover');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  
  // Проверка статуса подключения
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response && response.connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Мост подключён';
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Мост не подключён';
    }
  });
  
  // Получить текущий трек
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('gloowroom.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CURRENT_TRACK' }, (response) => {
        if (response && response.playing && response.title) {
          trackInfo.style.display = 'flex';
          noTrack.style.display = 'none';
          trackTitle.textContent = response.title;
          trackArtist.textContent = response.artist || 'Unknown';
          if (response.cover) {
            trackCover.src = response.cover;
          } else {
            trackCover.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%232a2a2a" width="60" height="60"/><text x="30" y="35" font-size="20" fill="%23666" text-anchor="middle">♪</text></svg>';
          }
        }
      });
    }
  });
});
