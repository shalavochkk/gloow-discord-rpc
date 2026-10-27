#!/usr/bin/env node
import DiscordRPC from 'discord-rpc';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

const clientId = config.clientId;
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

let currentTrack = null;
let startTimestamp = null;

function sendMessage(msg) {
  const buffer = Buffer.from(JSON.stringify(msg));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}

function readMessage() {
  const header = Buffer.alloc(4);
  const headerBytes = process.stdin.read(4);
  if (!headerBytes) return null;
  headerBytes.copy(header);
  const length = header.readUInt32LE(0);
  const data = process.stdin.read(length);
  if (!data) return null;
  return JSON.parse(data.toString());
}

rpc.on('ready', () => {
  console.error('[GloowRPC Bridge] Discord RPC connected');
  sendMessage({ type: 'connected', status: 'ready' });
  
  setActivity();
  
  setInterval(() => {
    setActivity();
  }, config.updateInterval);
});

async function setActivity() {
  if (!rpc || !rpc.user) return;
  
  if (!currentTrack || !currentTrack.playing) {
    rpc.clearActivity();
    sendMessage({ type: 'status', data: { playing: false } });
    return;
  }
  
  const activity = {
    details: currentTrack.title || 'Unknown Track',
    state: currentTrack.artist ? `by ${currentTrack.artist}` : 'Unknown Artist',
    largeImageKey: 'gloowroom',
    largeImageText: 'gloowroom.com',
    smallImageKey: 'play',
    smallImageText: 'Listening',
    instance: false,
  };
  
  if (!startTimestamp) {
    startTimestamp = Date.now();
  }
  
  activity.startTimestamp = startTimestamp;
  
  if (currentTrack.cover) {
    // Можно добавить поддержку кастомных картинок через assets
  }
  
  try {
    await rpc.setActivity(activity);
    sendMessage({ type: 'status', data: { playing: true, track: currentTrack } });
  } catch (e) {
    console.error('[GloowRPC Bridge] Error setting activity:', e);
  }
}

function handleMessages() {
  try {
    const msg = readMessage();
    if (!msg) {
      setTimeout(handleMessages, 100);
      return;
    }
    
    if (msg.type === 'presence' && msg.data) {
      if (!currentTrack || currentTrack.trackId !== msg.data.trackId || currentTrack.title !== msg.data.title) {
        startTimestamp = Date.now();
      }
      currentTrack = msg.data;
    }
    
    setTimeout(handleMessages, 10);
  } catch (e) {
    console.error('[GloowRPC Bridge] Error reading message:', e);
    setTimeout(handleMessages, 100);
  }
}

rpc.login({ clientId }).catch((e) => {
  console.error('[GloowRPC Bridge] Failed to login to Discord:', e);
  sendMessage({ type: 'error', error: e.message });
});

handleMessages();
console.error('[GloowRPC Bridge] Started');
