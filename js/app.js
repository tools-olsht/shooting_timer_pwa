import { init as initI18n } from './i18n.js';
import { unlock as unlockAudio } from './audio.js';
import { renderHome } from './ui/home.js';
import { renderModes } from './ui/modes.js';
import { renderPractice, cleanupPractice } from './ui/practice.js';
import { DISCIPLINES } from './disciplines.js';

const _app = () => document.getElementById('app');

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function _matchHash(hash) {
  if (!hash || hash === '#' || hash === '#home') return ['home', []];

  const modesMatch = hash.match(/^#modes\/([^/]+)$/);
  if (modesMatch) return ['modes', [modesMatch[1]]];

  const practiceMatch = hash.match(/^#practice\/([^/]+)\/([^/]+)$/);
  if (practiceMatch) return ['practice', [practiceMatch[1], practiceMatch[2]]];

  return ['home', []];
}

function _validateId(id, set) {
  return Object.keys(set).includes(id);
}

function route() {
  const [screen, params] = _matchHash(location.hash);
  const container = _app();

  // Always stop any active practice session when navigating (covers browser back, manual hash, etc.)
  cleanupPractice();

  if (screen === 'home') {
    renderHome(container);
  } else if (screen === 'modes') {
    const [dId] = params;
    if (!_validateId(dId, DISCIPLINES)) { location.hash = '#home'; return; }
    renderModes(container, dId);
  } else if (screen === 'practice') {
    const [dId, mId] = params;
    if (!_validateId(dId, DISCIPLINES) || !_validateId(mId, DISCIPLINES[dId].modes)) {
      location.hash = '#home'; return;
    }
    renderPractice(container, dId, mId);
  } else {
    renderHome(container);
  }
}

function init() {
  initI18n();
  // Unlock Web Audio on first user interaction (iOS Safari requirement)
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('hashchange', route);
  route();
}

init();
