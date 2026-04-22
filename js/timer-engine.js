// Event-driven timer scheduler. Sequence: Array<{offsetMs, type, payload}>.
// Dispatches CustomEvents on itself:
//   'tick'      → {detail: {elapsedMs, remainingMs, totalMs}}
//   'seq-event' → {detail: {type, payload}}
//   'done'      → sequence finished
export class TimerEngine extends EventTarget {
  constructor(sequence, { autoPauseOnHide = true } = {}) {
    super();
    this._autoPauseEnabled = autoPauseOnHide;
    this._sequence = [...sequence].sort((a, b) => a.offsetMs - b.offsetMs);
    this._startWallMs = 0;
    this._pausedElapsedMs = 0;
    this._timers = [];
    this._tickInterval = null;
    this._state = 'idle'; // 'idle' | 'running' | 'paused' | 'done'
    this._totalMs = sequence.length ? sequence[sequence.length - 1].offsetMs : 0;
    this._autoPaused = false; // true only when paused by visibility change, not by user

    this._onVisibility = () => {
      if (!this._autoPauseEnabled) return;
      if (document.hidden && this._state === 'running') {
        this.pause();
        this._autoPaused = true;
      } else if (!document.hidden && this._state === 'paused' && this._autoPaused) {
        this._autoPaused = false;
        this.resume();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility);
  }

  get isRunning() { return this._state === 'running'; }
  get isPaused() { return this._state === 'paused'; }
  get isDone() { return this._state === 'done'; }

  get elapsedMs() {
    if (this._state === 'running') {
      return this._pausedElapsedMs + (performance.now() - this._startWallMs);
    }
    return this._pausedElapsedMs;
  }

  get totalMs() { return this._totalMs; }

  start() {
    if (this._state !== 'idle') return;
    this._pausedElapsedMs = 0;
    this._startWallMs = performance.now();
    this._state = 'running';
    this._scheduleRemaining();
    this._startTick();
  }

  pause() {
    if (this._state !== 'running') return;
    this._autoPaused = false;
    this._pausedElapsedMs = this.elapsedMs;
    this._clearTimers();
    this._state = 'paused';
  }

  resume() {
    if (this._state !== 'paused') return;
    this._startWallMs = performance.now();
    this._state = 'running';
    this._scheduleRemaining();
    this._startTick();
  }

  reset() {
    this._clearTimers();
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._pausedElapsedMs = 0;
    this._startWallMs = 0;
    this._state = 'idle';
    // Re-attach listener for next start()
    document.addEventListener('visibilitychange', this._onVisibility);
  }

  destroy() {
    this._clearTimers();
    document.removeEventListener('visibilitychange', this._onVisibility);
  }

  _scheduleRemaining() {
    const elapsed = this._pausedElapsedMs;
    const pending = this._sequence.filter(e => e.offsetMs >= elapsed);

    this._timers = pending.map(event => {
      // Minimum 1ms delay so setTimeout never fires synchronously-adjacent in microtask context
      const delay = Math.max(1, event.offsetMs - elapsed);
      return setTimeout(() => {
        this.dispatchEvent(new CustomEvent('seq-event', {
          detail: { type: event.type, payload: event.payload },
        }));
        if (event === this._sequence[this._sequence.length - 1]) {
          this._clearTimers();
          this._state = 'done';
          this.dispatchEvent(new CustomEvent('done'));
        }
      }, delay);
    });
  }

  _startTick() {
    this._tickInterval = setInterval(() => {
      const elapsed = this.elapsedMs;
      this.dispatchEvent(new CustomEvent('tick', {
        detail: {
          elapsedMs: elapsed,
          remainingMs: Math.max(0, this._totalMs - elapsed),
          totalMs: this._totalMs,
        },
      }));
    }, 100);
  }

  _clearTimers() {
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }
}
