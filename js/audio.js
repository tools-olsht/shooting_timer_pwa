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

// Short click — optional shot indicator sound
export function playShotSound() {
  const ctx = _getCtx();
  _beep(ctx, 1100, 0.05, 0, 0.01);
}

// Short tone — series end / rest notification
export function playRestSignal() {
  const ctx = _getCtx();
  _beep(ctx, 330, 0.4, 0, 0.05);
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
