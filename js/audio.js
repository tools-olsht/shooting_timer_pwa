let _ctx = null;
let _hornBuffer = null;   // decoded AudioBuffer, loaded once
let _hornLoading = false; // guard against concurrent fetches

// Buffers for localized voice audio files
const _prepareBuffers = {};   // { en: AudioBuffer, es: AudioBuffer }
const _attentionBuffers = {}; // { en: AudioBuffer, es: AudioBuffer }

function _getCtx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Generic helper: fetch, decode, and return an AudioBuffer from a path.
async function _loadBuffer(path) {
  const ctx = _getCtx();
  const res = await fetch(path);
  const arrayBuf = await res.arrayBuffer();
  return ctx.decodeAudioData(arrayBuf);
}

// Preload horn.mp3 into an AudioBuffer so playback is instant and interference-free
async function _loadHorn() {
  if (_hornBuffer) return;
  if (_hornLoading) return;
  _hornLoading = true;
  try {
    _hornBuffer = await _loadBuffer('./audio/horn.mp3');
  } catch {
    _hornLoading = false; // allow a retry on next play attempt
  }
}

// Preload all four localized voice files. Best-effort — silently ignores failures.
async function _loadVoiceFiles() {
  const langs = ['en', 'es'];
  await Promise.all(langs.map(async lang => {
    try {
      if (!_prepareBuffers[lang]) {
        _prepareBuffers[lang] = await _loadBuffer(`./audio/prepare_${lang}.mp3`);
      }
    } catch { /* ignore — fallback to synth beep */ }
    try {
      if (!_attentionBuffers[lang]) {
        _attentionBuffers[lang] = await _loadBuffer(`./audio/attention_${lang}.mp3`);
      }
    } catch { /* ignore — fallback to synth beep */ }
  }));
}

// Play a preloaded AudioBuffer through a fresh BufferSourceNode at full gain.
function _playBuffer(buffer) {
  if (!buffer) return false;
  const ctx = _getCtx();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 1.0;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime);
  return true;
}

// Must be called on first user gesture to unlock AudioContext on iOS Safari
export function unlock() {
  _getCtx();
  _loadHorn();         // kick off horn preload
  _loadVoiceFiles();   // kick off voice file preloads
}

// Play localized "prepare" voice announcement. Falls back to synth beep if buffer not ready.
export function playPrepareVoice(lang) {
  const buf = _prepareBuffers[lang] || _prepareBuffers['en'];
  if (!_playBuffer(buf)) {
    // Buffer not ready — fallback synth
    const ctx = _getCtx();
    _beep(ctx, 660, 0.2, 0, 0.02);
    _beep(ctx, 660, 0.2, 0.3, 0.02);
  }
}

// Play localized "attention" voice announcement. Falls back to synth beep if buffer not ready.
export function playAttentionVoice(lang) {
  const buf = _attentionBuffers[lang] || _attentionBuffers['en'];
  if (!_playBuffer(buf)) {
    // Buffer not ready — fallback synth (same as existing rapid/slow beeps)
    const ctx = _getCtx();
    _beep(ctx, 880, 0.08, 0, 0.01);
    _beep(ctx, 880, 0.08, 0.15, 0.01);
  }
}

// Two short high beeps — attention signal for rapid modes (ISSF-style double alert)
export function playAttentionRapid() {
  const ctx = _getCtx();
  _beep(ctx, 880, 0.08, 0, 0.01);
  _beep(ctx, 880, 0.08, 0.15, 0.01);
}

// Single medium beep — attention signal for slow modes
export function playAttentionSlow() {
  const ctx = _getCtx();
  _beep(ctx, 440, 0.3, 0, 0.03);
}

// Loud horn blast — green light / shoot signal
export function playShootSignal() {
  _playHorn(0, 1.5);
}

// Noise-based gunshot — optional shot indicator sound
export function playShotSound() {
  const ctx = _getCtx();
  const duration = 0.28;
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr * duration, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Exponential decay on white noise to simulate a shot crack
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.06));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  // Lowpass to add body to the crack
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 1200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.0, ctx.currentTime);
  src.connect(lpf);
  lpf.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime);
  src.stop(ctx.currentTime + duration);
}

// Short horn blast — series end / rest notification
export function playRestSignal() {
  _playHorn(0, 1.2);
}

// Single horn blast — series-end indicator
export function playSeriesEndSignal() {
  _playHorn(0, 1.2);
}

// Play the preloaded horn buffer at the given delay and gain.
// Each call creates a fresh BufferSourceNode (the spec requires this —
// sources are one-shot), so no node accumulation occurs across series.
function _playHorn(delayS, gainValue) {
  if (!_hornBuffer) {
    // Buffer not ready yet — try to load and fall back to a loud beep
    _loadHorn();
    const ctx = _getCtx();
    _beep(ctx, 220, 0.8, delayS, 0.05);
    return;
  }
  const ctx = _getCtx();
  const src = ctx.createBufferSource();
  src.buffer = _hornBuffer;
  src.playbackRate.value = 2.0; // 2× speed — shorter, snappier blast
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime + delayS);
}

function _beep(ctx, freqHz, durationS, delayS, rampS) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freqHz;
  const t = ctx.currentTime + delayS;
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + durationS - rampS);
  osc.start(t);
  osc.stop(t + durationS);
}
