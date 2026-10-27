// Gloowroom Discord RPC - Content Script
// Отслеживает текущий играющий трек на gloowroom.com

let lastTrackId = null;
let updateInterval = null;

function getCurrentTrack() {
  // Попробуем найти информацию о текущем треке
  // Gloowroom использует Next.js, ищем в DOM или window
  
  // Способ 1: Поиск в DOM
  const titleEl = document.querySelector('[class*="track-title"], [class*="now-playing"] h1, [class*="player"] [class*="title"]');
  const artistEl = document.querySelector('[class*="track-artist"], [class*="now-playing"] [class*="artist"], [class*="player"] [class*="artist"]');
  const imgEl = document.querySelector('[class*="cover"] img, [class*="album-art"] img, [class*="player"] img');
  
  if (titleEl && titleEl.textContent.trim()) {
    return {
      title: titleEl.textContent.trim(),
      artist: artistEl ? artistEl.textContent.trim() : 'Unknown',
      cover: imgEl ? imgEl.src : null,
      url: window.location.href,
      playing: true,
      timestamp: Date.now()
    };
  }
  
  // Способ 2: Поиск в данных Next.js
  try {
    const nextData = document.getElementById('__NEXT_DATA__');
    if (nextData) {
      const data = JSON.parse(nextData.textContent);
      // Попробуем найти nowPlaying
      const pageProps = data.props?.pageProps;
      if (pageProps?.nowPlaying) {
        const track = pageProps.nowPlaying;
        return {
          title: track.title,
          artist: track.author?.name || track.author?.handle || 'Unknown',
          cover: track.coverUrl ? `https://gloowroom.com${track.coverUrl}` : null,
          trackId: track.id,
          url: `https://gloowroom.com/tracks/${track.slug}`,
          playing: true,
          timestamp: Date.now()
        };
      }
    }
  } catch (e) {}
  
  // Способ 3: Проверка наличия плеера и прогресса
  const playBtn = document.querySelector('[class*="play"] [aria-pressed="true"], [class*="pause"]');
  const isPlaying = !!playBtn;
  
  if (!isPlaying) {
    return { playing: false, timestamp: Date.now() };
  }
  
  return { playing: false, timestamp: Date.now() };
}

function sendUpdate() {
  const track = getCurrentTrack();
  const trackKey = track.trackId || `${track.title}-${track.artist}`;
  
  if (trackKey !== lastTrackId || track.playing) {
    lastTrackId = track.playing ? trackKey : null;
    chrome.runtime.sendMessage({
      type: 'TRACK_UPDATE',
      data: track
    });
  }
}

// Отслеживаем изменения
const observer = new MutationObserver(() => {
  sendUpdate();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true
});

// Периодическое обновление
updateInterval = setInterval(sendUpdate, 1500);
sendUpdate();

window.addEventListener('beforeunload', () => {
  if (updateInterval) clearInterval(updateInterval);
  observer.disconnect();
});
