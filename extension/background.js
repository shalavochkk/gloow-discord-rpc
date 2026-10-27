// Gloowroom Discord RPC - Background Service Worker

let nativePort = null;
let isConnected = false;

function connectToNativeHost() {
  try {
    nativePort = chrome.runtime.connectNative('com.gloowroom.discordrpc');
    isConnected = true;
    console.log('[GloowRPC] Connected to native host');
    
    nativePort.onMessage.addListener((message) => {
      console.log('[GloowRPC] Message from native host:', message);
    });
    
    nativePort.onDisconnect.addListener(() => {
      console.log('[GloowRPC] Disconnected from native host');
      isConnected = false;
      nativePort = null;
      // Попробуем переподключиться через 5 секунд
      setTimeout(connectToNativeHost, 5000);
    });
  } catch (e) {
    console.error('[GloowRPC] Failed to connect:', e);
    isConnected = false;
    setTimeout(connectToNativeHost, 5000);
  }
}

function sendToNativeHost(data) {
  if (isConnected && nativePort) {
    try {
      nativePort.postMessage(data);
    } catch (e) {
      console.error('[GloowRPC] Send error:', e);
      isConnected = false;
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRACK_UPDATE') {
    console.log('[GloowRPC] Track update:', message.data);
    sendToNativeHost({
      type: 'presence',
      data: message.data
    });
    sendResponse({ success: true });
  }
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[GloowRPC] Extension installed');
  connectToNativeHost();
});

connectToNativeHost();
