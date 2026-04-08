import { t } from '../i18n.js';
import { DISCIPLINES, getDiscipline } from '../disciplines.js';
import { createNavBar, createModeCard, openInfoDialog } from './components.js';

export function renderModes(container, disciplineId) {
  if (!DISCIPLINES[disciplineId]) {
    location.hash = '#home';
    return;
  }

  container.innerHTML = '';

  const nav = createNavBar({
    titleKey: `discipline.${disciplineId}.name`,
    showBack: true,
    onBack: () => { location.hash = '#home'; },
  });
  container.append(nav);

  const main = document.createElement('main');
  main.className = 'modes-main';

  const heading = document.createElement('p');
  heading.className = 'modes-subtitle';
  heading.dataset.i18nKey = 'label.select_mode';
  heading.textContent = t('label.select_mode');
  main.append(heading);

  const list = document.createElement('div');
  list.className = 'mode-list';

  const discipline = getDiscipline(disciplineId);
  const modeIds = Object.keys(discipline.modes).filter(id => id !== 'real_match');
  const realMatchId = discipline.modes.real_match ? 'real_match' : null;

  modeIds.forEach(modeId => {
    const card = createModeCard({
      disciplineId,
      modeId,
      onSelect: _navigate,
      onInfo: _showModeInfo,
    });
    list.append(card);
  });

  if (realMatchId) {
    const separator = document.createElement('div');
    separator.className = 'mode-separator';
    const sepLabel = document.createElement('span');
    sepLabel.dataset.i18nKey = 'label.real_match_last';
    sepLabel.textContent = t('label.real_match_last');
    separator.append(sepLabel);
    list.append(separator);

    const matchCard = createModeCard({
      disciplineId,
      modeId: realMatchId,
      onSelect: _navigate,
      onInfo: _showModeInfo,
      isRealMatch: true,
    });
    list.append(matchCard);
  }

  main.append(list);
  container.append(main);
}

function _navigate(disciplineId, modeId) {
  location.hash = `#practice/${disciplineId}/${modeId}`;
}

function _showModeInfo(disciplineId, modeId) {
  // Real match rules key includes the discipline id
  const rulesKey = modeId === 'real_match'
    ? `mode.real_match.${disciplineId}.rules`
    : `mode.${modeId}.rules`;

  openInfoDialog({
    titleKey: `mode.${modeId}.name`,
    descKey: `mode.${modeId}.desc`,
    rulesKey,
  });
}
