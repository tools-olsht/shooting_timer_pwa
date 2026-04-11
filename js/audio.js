let _ctx = null;
let _hornBuffer = null;   // decoded AudioBuffer, loaded once
let _hornLoading = false; // guard against concurrent fetches

function _getCtx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Preload horn.mp3 into an AudioBuffer so playback is instant and interference-free
async function _loadHorn() {
  if (_hornBuffer) return;
  if (_hornLoading) return;
  _hornLoading = true;
  try {
    const ctx = _getCtx();
    const res = await fetch('./audio/horn.mp3');
    const arrayBuf = await res.arrayBuffer();
    _hornBuffer = await ctx.decodeAudioData(arrayBuf);
  } catch {
    _hornLoading = false; // allow a retry on next play attempt
  }
}

// Must be called on first user gesture to unlock AudioContext on iOS Safari
export function unlock() {
  _getCtx();
  _loadHorn(); // kick off preload; we have a user gesture so fetch is allowed
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
