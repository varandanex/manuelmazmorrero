import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { renderGame } from '../src/render.js';

function renderEffect(value) {
  const text = [], shapes = [];
  const context = new Proxy({ canvas: { width: 960, height: 840 } }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'fillText' || key === 'strokeText') return value => text.push({ value, font: target.font });
      return (...args) => shapes.push([key, ...args]);
    },
  });
  const game = createGame(null, 1);
  game.effects = [{ type: 'number', value, x: 240, y: 200, life: .5, maxLife: .8 }];
  renderGame(context, game, 0, true);
  return { text, shapes };
}

test('damage and healing numbers use the pixel font without changing their value', () => {
  for (const value of ['24', '−18', '+25']) {
    const { text } = renderEffect(value);
    assert.equal(text.length, 2);
    assert.ok(text.every(draw => draw.value === value && draw.font.includes('Pixelify Sans')));
  }
});

test('shield hits draw an icon rather than combat prose', () => {
  const { text, shapes } = renderEffect('ESCUDO');
  assert.equal(text.length, 0);
  assert.ok(shapes.some(([method]) => method === 'closePath'));
  assert.ok(shapes.some(([method]) => method === 'fill'));
});
