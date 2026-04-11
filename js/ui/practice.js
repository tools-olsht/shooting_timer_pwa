import { DISCIPLINES, getMode, getDiscipline, buildEventSequence } from '../disciplines.js';
import { TimerEngine } from '../timer-engine.js';
import { playAttentionRapid, playAttentionSlow, playShootSignal, playShotSound, playRestSignal, playSeriesEndSignal } from '../audio.js';
import {
  createNavBar, createSignalBanner, setSignalState, createTargetRow, activateTargetSlot,
  resetTargetRow, createDuelTarget, setDuelState, createCountdownDisplay, setCountdown,
  createSeriesCounter, setSeriesCounter, createControlBar, setPlayState, createToggleButton,
  openInfoDialog,
} from './components.js';

// Module-level state persists across language changes
let _engine = null;
let _currentKey = '';
let _soundOn = false;
let _loopOn = false;
let _loopDelaySeconds = 3; // configurable wait between loops
let _disciplineId = '';
let _modeId = '';
let _shouldLoop = false;
let _isResting = false;
let _isSighting = false;
let _loopTimeoutId = null;
let _loopTickInterval = null;

// DOM refs updated on each render (survive language change via data-i18n-key walk)
let _signalBanner = null;
let _targetRow = null;
let _duelTarget = null;
let _countdown = null;
let _seriesCounter = null;
let _controlBar = null;
let _soundToggle = null;
let _loopToggle = null;
let _loopDelayRow = null;
let _loopDelayInput = null;

// Match state tracking
let _seriesIndex = 0;
let _stageIndex = 0;
let _countdownActive = false;
let _countdownStart = 0;    // elapsed time when countdown period started
let _countdownDuration = 0; // countdown duration in ms

export function renderPractice(container, disciplineId, modeId) {
  if (!DISCIPLINES[disciplineId] || !DISCIPLINES[disciplineId].modes[modeId]) {
    location.hash = '#home';
    return;
  }

  const sameMode = _currentKey === `${disciplineId}/${modeId}`;

  container.innerHTML = '';
  _buildDOM(container, disciplineId, modeId);

  if (!sameMode) {
    _destroyEngine();
    _disciplineId = disciplineId;
    _modeId = modeId;
    _currentKey = `${disciplineId}/${modeId}`;
    _seriesIndex = 0;
    _stageIndex = 0;
    _soundOn = false;
    _loopOn = false;
    _isResting = false;
    _isSighting = false;
    _countdownActive = false;
    _shouldLoop = false;
    _createEngine();
  } else {
    // Re-attach engine listener to new DOM
    _reattachEngineListeners();
    // Restore visual state
    _restoreState();
  }

  if (_soundToggle) _soundToggle._setState(_soundOn);
  if (_loopToggle) _loopToggle._setState(_loopOn);
  if (_loopDelayInput) _loopDelayInput.value = _loopDelaySeconds;
  _updateLoopDelayVisibility();
  _updateLoopInputState();
}

function _buildDOM(container, disciplineId, modeId) {
  const mode = getMode(disciplineId, modeId);
  const hasDuel = mode?.hasDuel;
  const hasLoop = mode?.hasLoop || false;
  const isRealMatch = mode?.isRealMatch || false;

  const nav = createNavBar({
    titleKey: `discipline.${disciplineId}.name`,
    showBack: true,
    onBack: () => {
      _destroyEngine();
      _currentKey = '';
      location.hash = `#modes/${disciplineId}`;
    },
  });
  container.append(nav);

  // Info button for the current mode (in a small bar below nav)
  const modeBar = document.createElement('div');
  modeBar.className = 'mode-bar';
  const modeName = document.createElement('span');
  modeName.className = 'mode-bar-name';
  modeName.dataset.i18nKey = `mode.${modeId}.name`;
  modeName.textContent = '';
  import('../i18n.js').then(({ t }) => { modeName.textContent = t(`mode.${modeId}.name`); });
  const modeInfoBtn = document.createElement('button');
  modeInfoBtn.className = 'info-btn info-btn--sm';
  modeInfoBtn.textContent = '?';
  modeInfoBtn.setAttribute('aria-label', 'Info');
  modeInfoBtn.addEventListener('click', () => {
    const rulesKey = modeId === 'real_match'
      ? `mode.real_match.${disciplineId}.rules`
      : `mode.${modeId}.rules`;
    openInfoDialog({ titleKey: `mode.${modeId}.name`, descKey: `mode.${modeId}.desc`, rulesKey });
  });
  modeBar.append(modeName, modeInfoBtn);
  container.append(modeBar);

  const main = document.createElement('main');
  main.className = 'practice-main';

  // Duel visual (only for duel mode)
  if (hasDuel) {
    _duelTarget = createDuelTarget();
    main.append(_duelTarget);
  } else {
    _duelTarget = null;
  }

  // Signal banner
  _signalBanner = createSignalBanner();
  main.append(_signalBanner);

  // Target row — always visible (duel mode shows recommended shot slots)
  _targetRow = createTargetRow(5);
  main.append(_targetRow);

  // Countdown
  _countdown = createCountdownDisplay();
  main.append(_countdown);

  // Series counter
  _seriesCounter = createSeriesCounter();
  main.append(_seriesCounter);

  // Controls
  _controlBar = createControlBar({
    onPlay: _handlePlayPause,
    onReset: _handleReset,
    onRepeat: _handleRepeat,
  });
  main.append(_controlBar);

  // Toggles row
  const toggleRow = document.createElement('div');
  toggleRow.className = 'toggle-row';

  _soundToggle = createToggleButton({
    i18nKey: 'btn.sound',
    icon: '🔊',
    initialState: _soundOn,
    onToggle: val => { _soundOn = val; },
  });
  toggleRow.append(_soundToggle);

  if (hasLoop && !isRealMatch) {
    _loopToggle = createToggleButton({
      i18nKey: 'btn.loop',
      icon: '🔁',
      initialState: _loopOn,
      onToggle: val => {
        _loopOn = val;
        _updateLoopDelayVisibility();
      },
    });
    toggleRow.append(_loopToggle);
  } else {
    _loopToggle = null;
  }

  main.append(toggleRow);

  // Loop delay row — only for loop-capable modes
  if (hasLoop && !isRealMatch) {
    _loopDelayRow = document.createElement('div');
    _loopDelayRow.className = 'loop-delay-row';
    _loopDelayRow.hidden = !_loopOn;

    const label = document.createElement('span');
    label.className = 'loop-delay-label';
    label.dataset.i18nKey = 'label.loop_delay';
    import('../i18n.js').then(({ t }) => { label.textContent = t('label.loop_delay'); });

    _loopDelayInput = document.createElement('input');
    _loopDelayInput.type = 'number';
    _loopDelayInput.className = 'loop-delay-input';
    _loopDelayInput.min = '0';
    _loopDelayInput.max = '300';
    _loopDelayInput.step = '1';
    _loopDelayInput.value = _loopDelaySeconds;
    _loopDelayInput.addEventListener('change', () => {
      const val = parseInt(_loopDelayInput.value, 10);
      _loopDelaySeconds = Number.isFinite(val) && val >= 0 ? val : 0;
      _loopDelayInput.value = _loopDelaySeconds;
    });
    // Prevent non-numeric input
    _loopDelayInput.addEventListener('keydown', e => {
      if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
    });

    const unit = document.createElement('span');
    unit.className = 'loop-delay-unit';
    unit.dataset.i18nKey = 'label.loop_delay_unit';
    import('../i18n.js').then(({ t }) => { unit.textContent = t('label.loop_delay_unit'); });

    _loopDelayRow.append(label, _loopDelayInput, unit);
    main.append(_loopDelayRow);
  } else {
    _loopDelayRow = null;
    _loopDelayInput = null;
  }

  container.append(main);
}

function _createEngine() {
  const sequence = buildEventSequence(_disciplineId, _modeId);
  _engine = new TimerEngine(sequence);
  _attachEngineListeners();
}

function _destroyEngine() {
  if (_loopTimeoutId !== null) {
    clearTimeout(_loopTimeoutId);
    _loopTimeoutId = null;
  }
  _clearLoopTick();
  if (_engine) {
    _engine.destroy();
    _engine = null;
  }
  _countdownActive = false;
  _shouldLoop = false;
}

function _clearLoopTick() {
  if (_loopTickInterval !== null) {
    clearInterval(_loopTickInterval);
    _loopTickInterval = null;
  }
}

function _attachEngineListeners() {
  if (!_engine) return;
  _engine.addEventListener('seq-event', _onSeqEvent);
  _engine.addEventListener('tick', _onTick);
  _engine.addEventListener('done', _onDone);
}

function _reattachEngineListeners() {
  if (!_engine) return;
  _engine.removeEventListener('seq-event', _onSeqEvent);
  _engine.removeEventListener('tick', _onTick);
  _engine.removeEventListener('done', _onDone);
  _attachEngineListeners();
}

function _onSeqEvent(e) {
  const { type, payload } = e.detail;

  switch (type) {
    case 'attention': {
      _isSighting = payload.isSighting ?? false;
      setSignalState(_signalBanner, _isSighting ? 'sighting' : 'attention');
      resetTargetRow(_targetRow);
      setCountdown(_countdown, null);
      _countdownActive = false;
      if (_duelTarget) setDuelState(_duelTarget, 'away');
      // Use payload.modeId to get the right mode (needed in real_match where _modeId is 'real_match')
      const attMode = getMode(_disciplineId, payload.modeId ?? _modeId);
      if (attMode?.signalType === 'rapid') playAttentionRapid();
      else playAttentionSlow();
      break;
    }
    case 'shoot':
    case 'start': {
      setSignalState(_signalBanner, type);
      playShootSignal();
      // Use payload.modeId so countdown shows the correct duration in real_match
      const activeMode = getMode(_disciplineId, payload.modeId ?? _modeId);
      _countdownStart = _engine.elapsedMs;
      _countdownDuration = (activeMode?.durationSeconds ?? 0) * 1000;
      _countdownActive = true;
      break;
    }
    case 'shot_target': {
      activateTargetSlot(_targetRow, payload.shotIndex);
      if (_soundOn) playShotSound();
      break;
    }
    case 'away': {
      if (_duelTarget) setDuelState(_duelTarget, 'away');
      setSignalState(_signalBanner, 'away');
      const awayMode = getMode(_disciplineId, payload.modeId ?? _modeId);
      _countdownStart = _engine.elapsedMs;
      _countdownDuration = (awayMode?.duelAwaySeconds ?? 7) * 1000;
      _countdownActive = true;
      playRestSignal();
      break;
    }
    case 'face': {
      if (_duelTarget) setDuelState(_duelTarget, 'face');
      setSignalState(_signalBanner, 'face');
      playShootSignal();
      const faceMode = getMode(_disciplineId, payload.modeId ?? _modeId);
      _countdownStart = _engine.elapsedMs;
      _countdownDuration = (faceMode?.duelFaceSeconds ?? 3) * 1000;
      _countdownActive = true;
      break;
    }
    case 'series_end': {
      _countdownActive = false;
      setCountdown(_countdown, null);
      setSignalState(_signalBanner, 'idle');
      // Don't count sighting series in the series counter
      if (!payload.isSighting) {
        _seriesIndex++;
      }
      _isSighting = false;
      playSeriesEndSignal();
      if (_loopOn && !getMode(_disciplineId, _modeId)?.isRealMatch) {
        _shouldLoop = true;
      }
      break;
    }
    case 'rest_start': {
      // Show LOAD banner for competition loading periods, REST for generic rests
      setSignalState(_signalBanner, payload.isLoading ? 'loading' : 'rest');
      _countdownActive = false;
      playRestSignal();
      resetTargetRow(_targetRow);
      _countdownDuration = payload.durationMs;
      _countdownStart = _engine.elapsedMs;
      _countdownActive = true;
      _isResting = true;
      _updateLoopInputState();
      break;
    }
    case 'rest_end': {
      _countdownActive = false;
      setCountdown(_countdown, null);
      _isResting = false;
      _updateLoopInputState();
      break;
    }
    case 'stage_break_start': {
      setSignalState(_signalBanner, 'stage_break');
      _countdownActive = false;
      playRestSignal();
      resetTargetRow(_targetRow);
      _stageIndex++;
      _countdownDuration = payload.durationMs;
      _countdownStart = _engine.elapsedMs;
      _countdownActive = true;
      _isResting = true;
      _updateLoopInputState();
      break;
    }
    case 'stage_break_end': {
      _countdownActive = false;
      setCountdown(_countdown, null);
      _isResting = false;
      _updateLoopInputState();
      break;
    }
    case 'half_break_start': {
      setSignalState(_signalBanner, 'half_break');
      _countdownActive = false;
      playRestSignal();
      resetTargetRow(_targetRow);
      _countdownDuration = payload.durationMs;
      _countdownStart = _engine.elapsedMs;
      _countdownActive = true;
      _isResting = true;
      _updateLoopInputState();
      break;
    }
    case 'half_break_end': {
      _countdownActive = false;
      setCountdown(_countdown, null);
      _isResting = false;
      _updateLoopInputState();
      break;
    }
    case 'match_end': {
      setSignalState(_signalBanner, 'match_end');
      setCountdown(_countdown, null);
      _countdownActive = false;
      _syncPlayState(false);
      break;
    }
  }

  _updateSeriesCounter();
}

function _onTick(e) {
  if (!_countdownActive) return;
  const { elapsedMs } = e.detail;
  const elapsedInPeriod = elapsedMs - _countdownStart;
  const remaining = (_countdownDuration - elapsedInPeriod) / 1000;
  setCountdown(_countdown, Math.max(0, remaining));
}

function _onDone() {
  _countdownActive = false;
  _isResting = false;

  if (_shouldLoop) {
    _shouldLoop = false;
    _seriesIndex = 0;
    setSignalState(_signalBanner, 'next_loop');
    resetTargetRow(_targetRow);
    if (_duelTarget) setDuelState(_duelTarget, 'away');
    _syncPlayState(false);
    _updateLoopInputState();
    const delayMs = Math.max(0, _loopDelaySeconds) * 1000;

    _clearLoopTick(); // ensure no stale interval
    if (delayMs > 0) {
      // Show countdown ticking down to next loop (local captures avoid stale module-level state)
      const loopStart = performance.now();
      setCountdown(_countdown, delayMs / 1000);
      _loopTickInterval = setInterval(() => {
        const rem = (delayMs - (performance.now() - loopStart)) / 1000;
        setCountdown(_countdown, Math.max(0, rem));
        if (rem <= 0) _clearLoopTick();
      }, 100);
    }

    _loopTimeoutId = setTimeout(() => {
      _loopTimeoutId = null;
      _clearLoopTick();
      setCountdown(_countdown, null);
      _destroyEngine();
      _createEngine();
      _engine.start();
      _syncPlayState(true);
      _updateLoopInputState();
    }, delayMs);
  } else {
    _syncPlayState(false);
    _updateLoopInputState();
  }
}

// Single source of truth for play/pause button visual state.
function _syncPlayState(playing) {
  if (_controlBar) setPlayState(_controlBar, playing);
}

function _handlePlayPause() {
  // If a loop delay timeout is pending and user clicks play, cancel it and restart immediately
  if (_loopTimeoutId !== null) {
    clearTimeout(_loopTimeoutId);
    _loopTimeoutId = null;
    _destroyEngine();
    _createEngine();
    _seriesIndex = 0;
    _stageIndex = 0;
    _engine.start();
    _syncPlayState(true);
    _updateLoopInputState();
    return;
  }

  if (!_engine) return;

  if (_engine.isDone) {
    // Engine finished — reset and start fresh (treat as "replay")
    _handleReset();
    _engine.start();
    _syncPlayState(true);
    return;
  }

  if (_engine.isRunning) {
    _engine.pause();
    _syncPlayState(false);
    _updateLoopInputState();
  } else if (_engine.isPaused) {
    _engine.resume();
    _syncPlayState(true);
    _updateLoopInputState();
  } else {
    // idle — start fresh
    _seriesIndex = 0;
    _stageIndex = 0;
    _engine.start();
    _syncPlayState(true);
    _updateLoopInputState();
  }
}

function _handleReset() {
  if (!_engine) return;
  _engine.reset();
  _seriesIndex = 0;
  _stageIndex = 0;
  _countdownActive = false;
  _shouldLoop = false;
  _isResting = false;
  _isSighting = false;
  setSignalState(_signalBanner, 'idle');
  resetTargetRow(_targetRow);
  setCountdown(_countdown, null);
  if (_duelTarget) setDuelState(_duelTarget, 'away');
  _syncPlayState(false);
  _updateSeriesCounter();
  _updateLoopInputState();
  // Re-create engine so sequence is fresh
  _destroyEngine();
  _createEngine();
}

function _handleRepeat() {
  _handleReset();
}

function _updateSeriesCounter() {
  const mode = getMode(_disciplineId, _modeId);
  if (!mode || !_seriesCounter) return;

  if (_isSighting) {
    setSeriesCounter(_seriesCounter, 'label.sighting_series', {});
    return;
  }

  if (mode.isRealMatch) {
    const stages = mode.stages || (mode.halfPattern ? _flattenHalves(mode) : []);
    const total = stages.reduce((acc, s) => acc + s.count, 0);
    setSeriesCounter(_seriesCounter, 'label.series', { current: Math.min(_seriesIndex + 1, total), total });
  } else if (mode.seriesPerMatch) {
    setSeriesCounter(_seriesCounter, 'label.series', {
      current: Math.min(_seriesIndex + 1, mode.seriesPerMatch),
      total: mode.seriesPerMatch,
    });
  }
}

function _flattenHalves(mode) {
  const stages = [];
  for (let h = 0; h < mode.halves; h++) stages.push(...mode.halfPattern);
  return stages;
}

function _restoreState() {
  if (!_engine) return;
  setSignalState(_signalBanner, 'idle');
  setCountdown(_countdown, null);
  if (_duelTarget) setDuelState(_duelTarget, 'away');
  _syncPlayState(_engine.isRunning);
  _updateSeriesCounter();
  _updateLoopInputState();
}

// Show/hide the loop delay row based on loop toggle state
function _updateLoopDelayVisibility() {
  if (_loopDelayRow) _loopDelayRow.hidden = !_loopOn;
}

// Enable the loop delay input whenever the engine is not actively running or resting.
// This allows editing before the first start, while paused, and after the match ends.
function _updateLoopInputState() {
  if (!_loopDelayInput) return;
  const isRunning = _engine?.isRunning ?? false;
  _loopDelayInput.disabled = isRunning || _isResting;
}
