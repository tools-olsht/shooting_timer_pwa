let _ctx = null;

function _getCtx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Must be called on first user gesture to unlock AudioContext on iOS Safari
export function unlock() {
  _getCtx();
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

// Long buzzer — green light / shoot signal
export function playShootSignal() {
  const ctx = _getCtx();
  _beep(ctx, 660, 0.7, 0, 0.02);
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

// Short tone — series end / rest notification
export function playRestSignal() {
  const ctx = _getCtx();
  _beep(ctx, 330, 0.4, 0, 0.05);
}

// Descending two-tone — distinct series-end indicator
export function playSeriesEndSignal() {
  const ctx = _getCtx();
  _beep(ctx, 660, 0.2, 0,    0.03);
  _beep(ctx, 440, 0.3, 0.22, 0.05);
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
