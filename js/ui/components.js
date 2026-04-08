import { t, getLang, setLang, SUPPORTED_LANGS } from '../i18n.js';

// Sets text content and registers data-i18n-key for automatic language updates
function _i18n(el, key, vars = {}) {
  el.dataset.i18nKey = key;
  if (Object.keys(vars).length) el.dataset.i18nVars = JSON.stringify(vars);
  el.textContent = t(key, vars);
  return el;
}

function _el(tag, cls, attrs = {}) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function createNavBar({ titleKey, showBack = false, onBack }) {
  const nav = _el('nav', 'nav-bar');

  const left = _el('div', 'nav-left');
  if (showBack) {
    const btn = _el('button', 'nav-back-btn', { 'aria-label': t('nav.back') });
    const chevron = _el('span', 'nav-chevron');
    chevron.textContent = '‹';
    const label = _i18n(_el('span', 'nav-back-label'), 'nav.back');
    btn.append(chevron, label);
    btn.addEventListener('click', onBack);
    left.append(btn);
  }

  const center = _el('div', 'nav-center');
  const title = _i18n(_el('h1', 'nav-title'), titleKey);
  center.append(title);

  const right = _el('div', 'nav-right');
  right.append(createLangSelector());

  nav.append(left, center, right);
  return nav;
}

export function createLangSelector() {
  const select = _el('select', 'lang-select', { 'aria-label': 'Language' });
  SUPPORTED_LANGS.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = t(`lang.${lang}`);
    if (lang === getLang()) opt.selected = true;
    select.append(opt);
  });
  select.addEventListener('change', () => setLang(select.value));
  return select;
}

export function createDisciplineCard({ id, onSelect, onInfo }) {
  const card = _el('article', 'discipline-card', { 'data-discipline-id': id });

  const body = _el('div', 'card-body');
  body.addEventListener('click', () => onSelect(id));

  const name = _i18n(_el('h2', 'card-title'), `discipline.${id}.name`);
  const sub = _i18n(_el('p', 'card-subtitle'), `discipline.${id}.subtitle`);
  body.append(name, sub);

  const infoBtn = _el('button', 'info-btn', { 'aria-label': t('btn.info') });
  infoBtn.textContent = '?';
  infoBtn.addEventListener('click', e => { e.stopPropagation(); onInfo(id); });

  card.append(body, infoBtn);
  return card;
}

export function createModeCard({ disciplineId, modeId, onSelect, onInfo, isRealMatch = false }) {
  const card = _el('article', `mode-card${isRealMatch ? ' mode-card--match' : ''}`, {
    'data-mode-id': modeId,
  });

  const body = _el('div', 'card-body');
  body.addEventListener('click', () => onSelect(disciplineId, modeId));

  const name = _i18n(_el('h3', 'card-title'), `mode.${modeId}.name`);
  body.append(name);

  const infoBtn = _el('button', 'info-btn', { 'aria-label': t('btn.info') });
  infoBtn.textContent = '?';
  infoBtn.addEventListener('click', e => { e.stopPropagation(); onInfo(disciplineId, modeId); });

  card.append(body, infoBtn);
  return card;
}

// type: 'idle' | 'attention' | 'shoot' | 'start' | 'rest' | 'away' | 'face' | 'stage_break' | 'match_end'
export function createSignalBanner() {
  const banner = _el('div', 'signal-banner signal-banner--idle');
  const label = _el('span', 'signal-label');
  label.textContent = '—';
  banner.append(label);
  banner._label = label;
  return banner;
}

export function setSignalState(banner, type) {
  const stateClasses = ['signal-banner--idle', 'signal-banner--attention',
    'signal-banner--shoot', 'signal-banner--rest', 'signal-banner--away', 'signal-banner--face'];
  stateClasses.forEach(cls => banner.classList.remove(cls));

  const classMap = {
    idle: 'signal-banner--idle',
    attention: 'signal-banner--attention',
    shoot: 'signal-banner--shoot',
    start: 'signal-banner--shoot',
    rest: 'signal-banner--rest',
    away: 'signal-banner--away',
    face: 'signal-banner--shoot',
    stage_break: 'signal-banner--rest',
    half_break: 'signal-banner--rest',
    match_end: 'signal-banner--rest',
  };
  banner.classList.add(classMap[type] || 'signal-banner--idle');

  const signalKeyMap = {
    idle: null,
    attention: 'signal.attention',
    shoot: 'signal.shoot',
    start: 'signal.start',
    rest: 'signal.rest',
    away: 'signal.away',
    face: 'signal.face',
    stage_break: 'signal.stage_break',
    half_break: 'signal.half_break',
    match_end: 'signal.match_complete',
  };
  const key = signalKeyMap[type];
  if (key) {
    _i18n(banner._label, key);
  } else {
    delete banner._label.dataset.i18nKey;
    banner._label.textContent = '—';
  }
}

// Creates the 5-slot target display row
export function createTargetRow(shots = 5) {
  const row = _el('div', 'target-row');
  for (let i = 0; i < shots; i++) {
    const slot = _el('div', 'target-slot', { 'data-index': i });
    const inner = _el('div', 'target-inner');
    slot.append(inner);
    row.append(slot);
  }
  return row;
}

export function activateTargetSlot(rowEl, index) {
  const slot = rowEl.querySelector(`[data-index="${index}"]`);
  if (slot) slot.classList.add('target-slot--active');
}

export function resetTargetRow(rowEl) {
  rowEl.querySelectorAll('.target-slot--active').forEach(s => s.classList.remove('target-slot--active'));
}

// Duel rotating target visual
export function createDuelTarget() {
  const wrap = _el('div', 'duel-target');
  const rect = _el('div', 'duel-rect');
  const circle = _el('div', 'duel-circle');
  rect.append(circle);
  wrap.append(rect);
  wrap.dataset.state = 'away';
  return wrap;
}

export function setDuelState(duelEl, state) {
  // state: 'away' | 'face'
  duelEl.dataset.state = state;
}

export function createCountdownDisplay() {
  const wrap = _el('div', 'countdown-wrap');
  const display = _el('div', 'countdown-display');
  display.textContent = '—';
  wrap.append(display);
  wrap._display = display;
  return wrap;
}

export function setCountdown(wrapEl, seconds) {
  if (seconds === null || seconds === undefined) {
    wrapEl._display.textContent = '—';
  } else {
    wrapEl._display.textContent = seconds >= 0 ? Math.ceil(seconds).toString() : '0';
  }
}

export function createSeriesCounter() {
  const el = _el('div', 'series-counter');
  el.textContent = '';
  return el;
}

export function setSeriesCounter(el, key, vars) {
  _i18n(el, key, vars);
}

export function createControlBar({ onPlay, onReset, onRepeat }) {
  const bar = _el('div', 'control-bar');

  const playBtn = _el('button', 'ctrl-btn ctrl-btn--play', { 'aria-label': t('btn.play') });
  const playIcon = _el('span', 'ctrl-icon');
  playIcon.textContent = '▶';
  const playLabel = _i18n(_el('span', 'ctrl-label'), 'btn.play');
  playBtn.append(playIcon, playLabel);

  const resetBtn = _el('button', 'ctrl-btn ctrl-btn--reset', { 'aria-label': t('btn.reset') });
  const resetIcon = _el('span', 'ctrl-icon');
  resetIcon.textContent = '↺';
  const resetLabel = _i18n(_el('span', 'ctrl-label'), 'btn.reset');
  resetBtn.append(resetIcon, resetLabel);

  const repeatBtn = _el('button', 'ctrl-btn ctrl-btn--repeat', { 'aria-label': t('btn.repeat') });
  const repeatIcon = _el('span', 'ctrl-icon');
  repeatIcon.textContent = '⟳';
  const repeatLabel = _i18n(_el('span', 'ctrl-label'), 'btn.repeat');
  repeatBtn.append(repeatIcon, repeatLabel);

  bar.append(playBtn, resetBtn, repeatBtn);

  let _isPlaying = false;

  function _setPlayState(playing) {
    _isPlaying = playing;
    playIcon.textContent = playing ? '⏸' : '▶';
    if (playing) {
      _i18n(playLabel, 'btn.pause');
      playBtn.setAttribute('aria-label', t('btn.pause'));
    } else {
      _i18n(playLabel, 'btn.play');
      playBtn.setAttribute('aria-label', t('btn.play'));
    }
  }

  playBtn.addEventListener('click', () => {
    onPlay(); // practice.js controls all state via setPlayState()
  });

  // Expose setPlayState so practice.js can sync UI with engine state
  bar._setPlayState = _setPlayState;
  bar._playBtn = playBtn;

  resetBtn.addEventListener('click', () => {
    _setPlayState(false);
    onReset();
  });

  repeatBtn.addEventListener('click', () => {
    _setPlayState(false);
    onRepeat();
  });

  return bar;
}

export function setPlayState(barEl, playing) {
  barEl._setPlayState(playing);
}

export function createToggleButton({ i18nKey, onToggle, initialState = false, icon = '' }) {
  const btn = _el('button', `toggle-btn${initialState ? ' toggle-btn--on' : ''}`, {
    'aria-pressed': String(initialState),
  });
  const iconEl = _el('span', 'toggle-icon');
  iconEl.textContent = icon;
  const label = _i18n(_el('span', 'toggle-label'), i18nKey);
  btn.append(iconEl, label);

  let _on = initialState;
  btn.addEventListener('click', () => {
    _on = !_on;
    btn.classList.toggle('toggle-btn--on', _on);
    btn.setAttribute('aria-pressed', String(_on));
    onToggle(_on);
  });

  btn._setState = (val) => {
    _on = val;
    btn.classList.toggle('toggle-btn--on', _on);
    btn.setAttribute('aria-pressed', String(_on));
  };

  return btn;
}

// Full-screen info dialog. Mounts into #dialog-overlay.
export function openInfoDialog({ titleKey, descKey, rulesKey }) {
  const overlay = document.getElementById('dialog-overlay');
  overlay.hidden = false;
  overlay.innerHTML = '';

  const dialog = _el('div', 'info-dialog', { role: 'dialog', 'aria-modal': 'true' });

  const header = _el('div', 'info-dialog-header');
  const title = _i18n(_el('h2', 'info-dialog-title'), titleKey);
  const closeBtn = _el('button', 'info-dialog-close', { 'aria-label': t('btn.close') });
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeInfoDialog);
  header.append(title, closeBtn);

  const body = _el('div', 'info-dialog-body');

  const desc = _i18n(_el('p', 'info-dialog-desc'), descKey);
  body.append(desc);

  if (rulesKey) {
    const rulesTitle = _el('h3', 'info-dialog-section-title');
    rulesTitle.textContent = '—';
    const rules = _i18n(_el('p', 'info-dialog-rules'), rulesKey);
    body.append(rules);
  }

  dialog.append(header, body);
  overlay.append(dialog);

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) closeInfoDialog(); }, { once: true });

  // Trap focus
  closeBtn.focus();
}

export function closeInfoDialog() {
  const overlay = document.getElementById('dialog-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
}
