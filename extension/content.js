// Gloowroom Discord RPC - Content Script

let lastTrackKey = null;
let checkInterval = null;

function findCurrentTrack() {
  // 1) Ищем <audio> элемент
  const audio = document.querySelector('audio');
  if (audio) {
    const isPlaying = !audio.paused && audio.currentTime > 0;
    if (isPlaying) {
      // Попробуем найти инфу о треке рядом
      const titleEl = document.querySelector('[data-testid*="track-title"], [class*="TrackTitle"], [class*="trackTitle"], [class*="now-playing"] [class*="title"], header h1, [role="heading"]');
      const artistEl = document.querySelector('[data-testid*="artist"], [class*="TrackArtist"], [class*="trackArtist"], [class*="now-playing"] [class*="artist"], [class*="author"]');
      const coverEl = document.querySelector('[data-testid*="cover"] img, [class*="Cover"] img, [class*="cover"] img, [class*="artwork"] img, [class*="player"] img');
      
      let title = titleEl?.textContent?.trim() || audio.title || document.title.replace(' — gloowroom', '').replace(' | gloowroom', '').trim();
      let artist = artistEl?.textContent?.trim() || 'Gloowroom';
      let cover = coverEl?.src || null;
      
      if (cover && cover.startsWith('/')) cover = 'https://gloowroom.com' + cover;
      
      return {
        title: title || 'Unknown Track',
        artist: artist || 'Unknown Artist',
        cover: cover,
        playing: true,
        trackId: audio.src || `${title}-${artist}`,
        url: window.location.href,
        timestamp: Date.now()
      };
    }
  }
  
  // 2) Ищем по data-атрибутам / классам плеера
  const player = document.querySelector('[class*="player" i], [id*="player" i], [data-state="playing"]');
  if (player) {
    const titleEl = player.querySelector('[class*="title" i], h1, h2, [class*="name" i]');
    const artistEl = player.querySelector('[class*="artist" i], [class*="author" i], [class*="uploader" i]');
    const coverEl = player.querySelector('img');
    const isPlaying = player.querySelector('[class*="pause" i], [aria-label*="pause" i], button[aria-pressed="true"]');
    
    if (isPlaying && titleEl?.textContent?.trim()) {
      let cover = coverEl?.src || null;
      if (cover && cover.startsWith('/')) cover = 'https://gloowroom.com' + cover;
      
      return {
        title: titleEl.textContent.trim(),
        artist: artistEl?.textContent?.trim() || 'Gloowroom',
        cover: cover,
        playing: true,
        trackId: titleEl.textContent.trim() + (artistEl?.textContent?.trim() || ''),
        url: window.location.href,
        timestamp: Date.now()
      };
    }
  }
  
  // 3) __NEXT_DATA__
  try {
    const nextData = document.getElementById('__NEXT_DATA__');
    if (nextData) {
      const data = JSON.parse(nextData.textContent);
      const findPlaying = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 10) return null;
        if (obj.isPlaying && obj.track) return obj.track;
        if (obj.nowPlaying && obj.nowPlaying.title) return obj.nowPlaying;
        if (obj.currentTrack && obj.currentTrack.title) return obj.currentTrack;
        for (const key of Object.keys(obj)) {
          const res = findPlaying(obj[key], depth + 1);
          if (res) return res;
        }
        return null;
      };
      const track = findPlaying(data);
      if (track && track.title) {
        return {
          title: track.title,
          artist: track.author?.name || track.author?.handle || track.artist || 'Gloowroom',
          cover: track.coverUrl ? (track.coverUrl.startsWith('http') ? track.coverUrl : 'https://gloowroom.com' + track.coverUrl) : track.cover,
          trackId: track.id || track.slug,
          url: track.slug ? `https://gloowroom.com/tracks/${track.slug}` : window.location.href,
          playing: true,
          timestamp: Date.now()
        };
      }
    }
  } catch (e) {}
  
  // 4) document.title fallback
  if (document.title && !document.title.includes('gloowroom') || document.title.includes(' - ')) {
    const t = document.title.replace(' | gloowroom.com', '').replace(' — gloowroom', '').trim();
    if (t && t.length > 2) {
      // Проверим есть ли кнопка паузы
      const pause = document.querySelector('[class*="pause" i]');
      if (pause) {
        const parts = t.split(' - ');
        return {
          title: parts[0] || t,
          artist: parts[1] || 'Gloowroom',
          cover: null,
          playing: true,
          trackId: t,
          url: window.location.href,
          timestamp: Date.now()
        };
      }
    }
  }
  
  return { playing: false, timestamp: Date.now() };
}

function sendUpdate() {
  const track = findCurrentTrack();
  const key = track.playing ? (track.trackId || track.title) : 'STOPPED';
  
  if (key !== lastTrackKey) {
    lastTrackKey = key;
    console.log('[GloowRPC] Sending:', track);
    try {
      chrome.runtime.sendMessage({ type: 'TRACK_UPDATE', data: track });
    } catch (e) {
      console.error('[GloowRPC] Send failed:', e);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TRACK') {
    sendResponse(findCurrentTrack());
    return true;
  }
});

const observer = new MutationObserver(sendUpdate);
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

checkInterval = setInterval(sendUpdate, 1000);
sendUpdate();

console.log('[GloowRPC] Content script loaded on', window.location.href);
