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
  try {
    const buffer = Buffer.from(JSON.stringify(msg));
    const header = Buffer.alloc(4);
    header.writeUInt32LE(buffer.length, 0);
    process.stdout.write(header);
    process.stdout.write(buffer);
  } catch (e) {}
}

function readMessage() {
  try {
    const headerBytes = process.stdin.read(4);
    if (!headerBytes || headerBytes.length < 4) return null;
    const header = Buffer.alloc(4);
    headerBytes.copy(header);
    const length = header.readUInt32LE(0);
    if (length > 10 * 1024 * 1024) return null;
    const data = process.stdin.read(length);
    if (!data) return null;
    return JSON.parse(data.toString());
  } catch (e) {
    return null;
  }
}

rpc.on('ready', () => {
  console.error('[GloowRPC Bridge] Connected to Discord');
  sendMessage({ type: 'connected', status: 'ready' });
  setInterval(setActivity, 1000);
  setActivity();
});

async function setActivity() {
  if (!rpc || !rpc.user) return;
  
  if (!currentTrack || !currentTrack.playing) {
    try { await rpc.clearActivity(); } catch(e) {}
    sendMessage({ type: 'status', playing: false });
    return;
  }
  
  if (!startTimestamp) startTimestamp = Date.now();
  
  const activity = {
    details: currentTrack.title.substring(0, 128),
    state: `by ${currentTrack.artist}`.substring(0, 128),
    largeImageKey: 'gloowroom',
    largeImageText: 'gloowroom.com',
    smallImageKey: 'play',
    smallImageText: 'Listening on Gloowroom',
    startTimestamp: startTimestamp,
    instance: false,
  };
  
  try {
    await rpc.setActivity(activity);
    sendMessage({ type: 'status', playing: true });
  } catch (e) {
    console.error('[GloowRPC Bridge] Activity error:', e.message);
  }
}

function handleMessages() {
  const msg = readMessage();
  if (msg) {
    if (msg.type === 'presence' && msg.data) {
      const track = msg.data;
      if (currentTrack?.trackId !== track.trackId || currentTrack?.title !== track.title) {
        startTimestamp = Date.now();
      }
      currentTrack = track;
    }
  }
  setTimeout(handleMessages, 50);
}

rpc.login({ clientId: config.clientId }).catch((e) => {
  console.error('[GloowRPC Bridge] Login failed:', e.message);
  sendMessage({ type: 'error', error: e.message });
});

handleMessages();
console.error('[GloowRPC Bridge] Starting...');
