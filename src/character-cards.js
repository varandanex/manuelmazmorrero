import { createGame, enemyStats, FLOORS } from './game.js';
import { ENCOUNTER_CARDS } from './encounter-cards.js';
import { BOSS_DIALOGUES } from './boss-dialogues.js';

export const CARD_SIZE = { width: 1600, height: 2400 };
const roles = ['manolo', ...FLOORS.flatMap(f => f.mobs), ...FLOORS.map(f => f.bossType)];
const classes = {
  manolo: 'Concursante · cuerpo a cuerpo', grunt: 'Acosador · cuerpo a cuerpo', bat: 'Hostigador · veloz',
  caster: 'Artillería · a distancia', drek: 'Depredador · manada', jikininki: 'Bruto · golpe de área',
  acid: 'Artillería · corrosivo', engineer: 'Conductor · embestida', butcher: 'Jefe · embestida',
  rat: 'Alimaña · salto corto', wallwatch: 'Acechador · flanqueo', woodcutter: 'Talador · golpe de área',
  bramble: 'Bruto · abanico de púas', coal: 'Tanque · control de fuego', nightweasel: 'Depredador · embestida',
  funeral: 'Guardia · estocada a distancia', hobgoblin: 'Zapador · bombas',
  spore: 'Jefa · control de zona', mantaur: 'Jefe · fuerza bruta', elemental: 'Jefe · fuego de área', host: 'Jefa · escudo y rayos',
};
// Original lines for these game adaptations, not quotations from the novels.
const quips = {
  grunt: 'Te pincho el paraguas y ya tienes colador, campeón.',
  bat: 'Ni con el paraguas abierto tapas esta putada.',
  caster: '¿Paraguas? Qué detalle. Siempre salpico.',
  drek: 'Tú guarda el paraguas. Yo te guardo el tobillo.',
  jikininki: 'Levanta los pies. Voy a fregar contigo.',
  acid: 'Ese paraguas tiene dos lavados. Y uno es el tuyo.',
  engineer: '¿Licencia de obras? Tengo licencia para darte.',
  rat: 'Ese paraguas sabe a pollo. O vas a saber tú.',
  wallwatch: 'Tú mira al frente. Yo ya te miro el culo.',
  woodcutter: 'Paraguas de madera. Leña del concursante caído.',
  bramble: 'Yo también tengo varillas. Las mías no se pliegan.',
  coal: 'Te seco el paraguas. Lo de las cejas va aparte.',
  nightweasel: 'Seis patas y tú solo tapas dos con ese paraguas.',
  funeral: 'No doblo por ti. Te doblo a ti.',
  hobgoblin: 'Abre el paraguas: el pronóstico da metralla.',
};
const range = values => {
  const lo = Math.min(...values), hi = Math.max(...values);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
};

export function characterCards() {
  const hero = createGame(null, 1).player;
  return roles.map((id, index) => {
    const isHero = id === 'manolo', bossFloor = FLOORS.findIndex(f => f.bossType === id), isBoss = bossFloor >= 0;
    const floors = isHero ? FLOORS.map((_, i) => i) : FLOORS.flatMap((f, i) => f.bossType === id || f.mobs.includes(id) ? [i] : []);
    const encounter = ENCOUNTER_CARDS[id], values = isHero ? [hero] : floors.map(f => enemyStats(id, f));
    const art = isHero ? 'hero-manu-umbrella' : `enemies/${encounter.art}`;
    const movement = id === 'host' ? 'Patrulla' : id === 'spore' ? 'Fija' : `${range(values.map(s => s.speed))} u/s`;
    return {
      id, number: index + 1, name: isHero ? 'Manolo' : encounter.name,
      category: isHero ? 'Concursante' : isBoss ? 'Jefe de piso' : 'Enemigo', className: classes[id],
      kind: isHero ? 'hero' : isBoss ? 'boss' : 'enemy', floors,
      location: isHero ? 'Los cinco pisos · un solo paraguas' : isBoss ? `Piso ${bossFloor + 1} · ${FLOORS[bossFloor].name}` : `Piso${floors.length === 1 ? '' : 's'} ${floors.map(f => f + 1).join(' · ')}`,
      preview: `/assets/webp/${art}.webp`, original: `/assets/art/${art}.png`,
      quote: isHero ? BOSS_DIALOGUES[0].lines[1].text : isBoss ? BOSS_DIALOGUES[bossFloor].lines[0].text : quips[id],
      stats: [
        { label: 'Vida', value: range(values.map(s => s.hp)), detail: 'PV' },
        { label: 'Daño', value: range(values.map(s => s.damage)), detail: isHero ? 'Paraguazo' : 'Contacto' },
        { label: 'Movilidad', value: movement, detail: id === 'host' ? 'Ruta propia' : id === 'spore' ? 'Sin desplazamiento' : 'Velocidad base' },
      ],
      attacks: isHero ? [
        { name: 'Paraguazo reglamentario', description: 'Golpea en arco a corta distancia y apunta hacia el enemigo más cercano. Cobertura especial contra la lluvia de hostias.' },
        { name: 'Evasión de responsabilidades', description: 'Esquiva en la dirección de movimiento con una breve invulnerabilidad. No vale para el cumpleaños.' },
      ] : [{ name: encounter.attack, description: encounter.description }],
      tip: isHero ? 'Muévete, golpea y esquiva. El paraguas no te hace inmortal.' : encounter.tip,
      note: isHero ? 'Valores iniciales, sin mejoras.' : ['coal', 'hobgoblin'].includes(id) ? 'Especie de los libros adaptada como rival. Daño indicado: contacto.' : 'Daño indicado: contacto. Los ataques especiales pueden variar.',
    };
  });
}

// The gallery and printable PNGs share one content renderer. Never insert catalog HTML.
export function createCharacterCard(profile, { print = false } = {}) {
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const card = el('article', `character-card cc-${profile.kind}${print ? ' cc-print' : ''}`);
  card.dataset.character = profile.id;
  const header = el('header', 'cc-header');
  const overline = el('div', 'cc-overline');
  overline.append(el('span', '', 'EXPEDIENTE DEL SISTEMA'), el('span', '', `${String(profile.number).padStart(2, '0')} / ${roles.length}`));
  header.append(overline, el('h3', 'cc-title', profile.name), el('p', 'cc-class', profile.className), el('p', 'cc-location', profile.location));
  const body = el('div', 'cc-body'), portrait = el('div', 'cc-portrait');
  const image = el('img', 'cc-image'); image.src = print ? profile.original : profile.preview;
  image.alt = profile.id === 'manolo' ? 'Manolo de cuerpo entero con el paraguas cerrado' : profile.name;
  image.draggable = false; image.decoding = 'async'; portrait.append(image);
  const details = el('div', 'cc-details');
  details.append(el('blockquote', 'cc-quote', `«${profile.quote}»`));
  const stats = el('dl', 'cc-stats');
  for (const stat of profile.stats) {
    const pair = el('div'); pair.append(el('dt', '', stat.label));
    const value = el('dd'); value.append(el('strong', '', stat.value), el('span', '', stat.detail)); pair.append(value); stats.append(pair);
  }
  details.append(stats);
  const attacks = el('section', 'cc-attacks'); attacks.append(el('h4', 'cc-label', 'ATAQUES Y HABILIDADES'));
  for (const attack of profile.attacks) attacks.append(el('h5', 'cc-attack-name', attack.name), el('p', 'cc-description', attack.description));
  details.append(attacks);
  const tip = el('section', 'cc-tip'); tip.append(el('h4', 'cc-label', profile.kind === 'hero' ? 'MANUAL DEL CONCURSANTE' : 'CÓMO NO PALMARLA'), el('p', '', profile.tip));
  details.append(tip, el('p', 'cc-note', profile.note));
  body.append(portrait, details);
  const footer = el('footer', 'cc-footer'); footer.append(el('strong', '', 'MANOLO EL MAZMORRERO'), el('span', '', 'Adaptación del juego · no son estadísticas de los libros'));
  card.append(header, body, footer);
  return card;
}
