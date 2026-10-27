// Gloowroom Discord RPC - Background Service Worker

let nativePort = null;
let isConnected = false;
let lastData = null;

function connectToNativeHost() {
  try {
    if (nativePort) {
      try { nativePort.disconnect(); } catch(e) {}
    }
    nativePort = chrome.runtime.connectNative('com.gloowroom.discordrpc');
    isConnected = true;
    console.log('[GloowRPC] Connected to native host');
    
    nativePort.onMessage.addListener((message) => {
      console.log('[GloowRPC] From native:', message);
    });
    
    nativePort.onDisconnect.addListener(() => {
      console.log('[GloowRPC] Disconnected:', chrome.runtime.lastError?.message);
      isConnected = false;
      nativePort = null;
      setTimeout(connectToNativeHost, 3000);
    });
  } catch (e) {
    console.error('[GloowRPC] Connect error:', e.message);
    isConnected = false;
    setTimeout(connectToNativeHost, 5000);
  }
}

function sendToNativeHost(data) {
  if (isConnected && nativePort) {
    try {
      nativePort.postMessage(data);
      return true;
    } catch (e) {
      console.error('[GloowRPC] Send error:', e);
      isConnected = false;
      connectToNativeHost();
      return false;
    }
  }
  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRACK_UPDATE') {
    lastData = message.data;
    console.log('[GloowRPC] Track:', message.data);
    sendToNativeHost({ type: 'presence', data: message.data });
    sendResponse({ success: isConnected });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({ connected: isConnected, lastData: lastData });
  }
  return true;
});

chrome.runtime.onInstalled.addListener(connectToNativeHost);
chrome.runtime.onStartup.addListener(connectToNativeHost);
connectToNativeHost();
