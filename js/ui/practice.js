import { DISCIPLINES, getMode, getDiscipline, buildEventSequence } from '../disciplines.js';
import { TimerEngine } from '../timer-engine.js';
import { playAttentionRapid, playAttentionSlow, playShootSignal, playShotSound, playRestSignal } from '../audio.js';
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
let _disciplineId = '';
let _modeId = '';

// DOM refs updated on each render (survive language change via data-i18n-key walk)
let _signalBanner = null;
let _targetRow = null;
let _duelTarget = null;
let _countdown = null;
let _seriesCounter = null;
let _controlBar = null;
let _soundToggle = null;
let _loopToggle = null;

// Match state tracking
let _seriesIndex = 0;
let _stageIndex = 0;
let _countdownActive = false;
let _countdownStart = 0;    // green-light elapsed time
let _countdownDuration = 0; // series duration in ms
let _tickHandler = null;

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
    _countdownActive = false;
    _createEngine();
  } else {
    // Re-attach engine listener to new DOM
    _reattachEngineListeners();
    // Restore visual state
    _restoreState();
  }

  if (_soundToggle) _soundToggle._setState(_soundOn);
  if (_loopToggle) _loopToggle._setState(_loopOn);
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
  // Import t lazily to avoid circular at module level
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

  // Target row (hidden in duel mode, shown in timed modes)
  _targetRow = createTargetRow(5);
  if (hasDuel) _targetRow.classList.add('target-row--hidden');
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
      onToggle: val => { _loopOn = val; },
    });
    toggleRow.append(_loopToggle);
  } else {
    _loopToggle = null;
  }

  main.append(toggleRow);
  container.append(main);
}

function _createEngine() {
  const sequence = buildEventSequence(_disciplineId, _modeId);
  _engine = new TimerEngine(sequence);
  _attachEngineListeners();
}

function _destroyEngine() {
  if (_engine) {
    _engine.destroy();
    _engine = null;
  }
  _tickHandler = null;
  _countdownActive = false;
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
      setSignalState(_signalBanner, 'attention');
      resetTargetRow(_targetRow);
      setCountdown(_countdown, null);
      _countdownActive = false;
      if (_duelTarget) setDuelState(_duelTarget, 'away');
      const mode = getMode(_disciplineId, _modeId);
      if (mode?.signalType === 'rapid') playAttentionRapid();
      else playAttentionSlow();
      break;
    }
    case 'shoot':
    case 'start': {
      setSignalState(_signalBanner, type);
      playShootSignal();
      const mode = getMode(_disciplineId, _modeId);
      _countdownStart = _engine.elapsedMs;
      _countdownDuration = (mode?.durationSeconds ?? 0) * 1000;
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
      if (payload.shotIndex === 0) playAttentionRapid();
      break;
    }
    case 'face': {
      if (_duelTarget) setDuelState(_duelTarget, 'face');
      setSignalState(_signalBanner, 'face');
      playShootSignal();
      if (_soundOn) playShotSound();
      break;
    }
    case 'series_end': {
      _countdownActive = false;
      setCountdown(_countdown, 0);
      _seriesIndex++;
      if (_loopOn && !getMode(_disciplineId, _modeId)?.isRealMatch) {
        // Restart the engine for another series loop
        _engine.reset();
        _seriesIndex = 0;
        resetTargetRow(_targetRow);
        setSignalState(_signalBanner, 'idle');
        setCountdown(_countdown, null);
        setTimeout(() => {
          _engine.start();
          setPlayState(_controlBar, true);
        }, 500);
      }
      break;
    }
    case 'rest_start': {
      setSignalState(_signalBanner, 'rest');
      _countdownActive = false;
      playRestSignal();
      resetTargetRow(_targetRow);
      // Show rest countdown
      _countdownDuration = payload.durationMs;
      _countdownStart = _engine.elapsedMs;
      _countdownActive = true;
      break;
    }
    case 'rest_end': {
      _countdownActive = false;
      setCountdown(_countdown, null);
      break;
    }
    case 'stage_break_start': {
      setSignalState(_signalBanner, 'stage_break');
      _countdownActive = false;
      playRestSignal();
      resetTargetRow(_targetRow);
      _stageIndex++;
      break;
    }
    case 'stage_break_end': {
      setCountdown(_countdown, null);
      break;
    }
    case 'match_end': {
      setSignalState(_signalBanner, 'match_end');
      setCountdown(_countdown, null);
      _countdownActive = false;
      setPlayState(_controlBar, false);
      break;
    }
  }

  _updateSeriesCounter();
}

function _onTick(e) {
  if (!_countdownActive) return;
  const { elapsedMs } = e.detail;
  const elapsedInSeries = elapsedMs - _countdownStart;
  const remaining = (_countdownDuration - elapsedInSeries) / 1000;
  setCountdown(_countdown, Math.max(0, remaining));
}

function _onDone() {
  setPlayState(_controlBar, false);
  _countdownActive = false;
}

function _handlePlayPause() {
  if (!_engine) return;

  if (_engine.isDone) {
    _handleRepeat();
    return;
  }

  if (_engine.isRunning) {
    _engine.pause();
    setPlayState(_controlBar, false);
  } else if (_engine.isPaused) {
    _engine.resume();
    setPlayState(_controlBar, true);
  } else {
    // idle — start fresh
    _seriesIndex = 0;
    _stageIndex = 0;
    _engine.start();
    setPlayState(_controlBar, true);
  }
}

function _handleReset() {
  if (!_engine) return;
  _engine.reset();
  _seriesIndex = 0;
  _stageIndex = 0;
  _countdownActive = false;
  setSignalState(_signalBanner, 'idle');
  resetTargetRow(_targetRow);
  setCountdown(_countdown, null);
  if (_duelTarget) setDuelState(_duelTarget, 'away');
  _updateSeriesCounter();
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
  setPlayState(_controlBar, _engine.isRunning);
  _updateSeriesCounter();
}
