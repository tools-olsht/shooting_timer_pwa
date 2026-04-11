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

// Strident horn blast — green light / shoot signal
export function playShootSignal() {
  const ctx = _getCtx();
  _horn(ctx, 0, 1.2);
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
  const ctx = _getCtx();
  _horn(ctx, 0, 0.6);
}

// Two short horn blasts — distinct series-end indicator
export function playSeriesEndSignal() {
  const ctx = _getCtx();
  _horn(ctx, 0,   0.35);
  _horn(ctx, 0.5, 0.35);
}

// Strident horn: layered sawtooth oscillators + overdrive waveshaper + compressor at 4× gain
function _horn(ctx, delayS, durationS) {
  const t = ctx.currentTime + delayS;

  // Hard limiter at the very end of the chain
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -3;
  compressor.knee.value = 0;
  compressor.ratio.value = 20;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.05;
  compressor.connect(ctx.destination);

  // Soft-clip waveshaper — increases perceived loudness via harmonic saturation
  const shaper = ctx.createWaveShaper();
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = (Math.PI + 300) * x / (Math.PI + 300 * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '4x';
  shaper.connect(compressor);

  // Master gain at 4.0 for maximum drive into the waveshaper
  const master = ctx.createGain();
  master.connect(shaper);
  master.gain.setValueAtTime(4.0, t);
  master.gain.setValueAtTime(4.0, t + durationS - 0.06);
  master.gain.exponentialRampToValueAtTime(0.001, t + durationS);

  // Three sawtooth partials for a rich, strident horn timbre
  const partials = [
    { freq: 220, gain: 1.0 },
    { freq: 440, gain: 0.6 },
    { freq: 660, gain: 0.3 },
  ];
  for (const { freq, gain } of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + durationS);
  }
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
