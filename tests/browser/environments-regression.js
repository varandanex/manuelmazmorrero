// Run with ui-fixture.js appended only to the local main module response.
(async () => {
  const q = window.__uiQa, results = [];
  const check = (name, pass) => results.push({ name, pass: !!pass });
  q.menu(); scrollTo(0, 0); await document.fonts.ready;
  const credit = document.querySelector('.creator-credit'), rect = credit.getBoundingClientRect();
  check('the dedication uses the exact approved text', credit.textContent.trim() === 'UNA AVENTURA HECHA CON ❤️ POR KYV');
  check('the footer repeats the approved dedication', document.querySelector('.lobby-footer > span').textContent === 'UNA AVENTURA HECHA CON ❤️ POR KYV');
  check('the dedication comes before the menu actions', rect.bottom < document.querySelector('.entry-actions').getBoundingClientRect().top);
  check('the dedication is above the fold', rect.top >= 0 && rect.bottom <= innerHeight);
  check('the dedication fits horizontally', rect.left >= 0 && rect.right + 4 <= innerWidth && credit.scrollWidth <= credit.clientWidth);
  check('KYV is prominent rather than footer-sized', parseFloat(getComputedStyle(credit.querySelector('strong')).fontSize) >= 27);
  check('the dedication has a contrasting printed panel', getComputedStyle(credit).backgroundColor === 'rgb(244, 237, 221)');
  check('the cover has no horizontal overflow', document.documentElement.scrollWidth <= innerWidth);
  for (const floor of [0, 1, 2, 3, 4]) {
    q.scene('boss', floor);
    const arena = document.getElementById('arena').getBoundingClientRect();
    check(`${floor}: arena fits the viewport`, arena.left >= 0 && arena.right <= innerWidth && arena.bottom <= innerHeight);
    check(`${floor}: player and boss health remain available`, !document.getElementById('boss-hud').hidden && !!document.getElementById('health-bar'));
    check(`${floor}: combat remains free of prose`, !/[a-záéíóúñ]/i.test(document.getElementById('game-screen').innerText));
    check(`${floor}: dedication stays out of combat`, document.getElementById('lobby').hidden);
  }
  q.menu();
  return results;
})()
