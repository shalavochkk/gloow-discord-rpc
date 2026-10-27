// Gloowroom Discord RPC - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const trackInfo = document.getElementById('trackInfo');
  const noTrack = document.getElementById('noTrack');
  const trackCover = document.getElementById('trackCover');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Ошибка расширения';
      return;
    }
    if (response && response.connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Мост подключён';
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Мост не подключён (запусти bridge)';
    }
    
    if (response && response.lastData && response.lastData.playing) {
      showTrack(response.lastData);
    }
  });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('gloowroom.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CURRENT_TRACK' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.playing && response.title) {
          showTrack(response);
        }
      });
    }
  });
  
  function showTrack(track) {
    trackInfo.style.display = 'flex';
    noTrack.style.display = 'none';
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist || 'Unknown';
    if (track.cover) {
      trackCover.src = track.cover;
    } else {
      trackCover.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="#2a2a2a" width="60" height="60"/><text x="30" y="38" font-size="24" fill="#a855f7" text-anchor="middle">♫</text></svg>');
    }
  }
});
