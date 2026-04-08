import { t } from '../i18n.js';
import { DISCIPLINES } from '../disciplines.js';
import { createNavBar, createDisciplineCard, openInfoDialog } from './components.js';

export function renderHome(container) {
  container.innerHTML = '';

  const nav = createNavBar({ titleKey: 'app.title', showBack: false });
  container.append(nav);

  const main = document.createElement('main');
  main.className = 'home-main';

  const heading = document.createElement('p');
  heading.className = 'home-subtitle';
  heading.dataset.i18nKey = 'label.disciplines';
  heading.textContent = t('label.disciplines');
  main.append(heading);

  const list = document.createElement('div');
  list.className = 'discipline-list';

  Object.keys(DISCIPLINES).forEach(id => {
    const card = createDisciplineCard({
      id,
      onSelect: (disciplineId) => {
        location.hash = `#modes/${disciplineId}`;
      },
      onInfo: (disciplineId) => {
        openInfoDialog({
          titleKey: `discipline.${disciplineId}.name`,
          descKey: `discipline.${disciplineId}.desc`,
          rulesKey: `discipline.${disciplineId}.rules`,
        });
      },
    });
    list.append(card);
  });

  main.append(list);
  container.append(main);
}
