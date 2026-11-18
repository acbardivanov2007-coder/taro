import test from 'node:test';
import assert from 'node:assert/strict';
import { TAROT_DECK, MAJOR_ARCANA, MINOR_ARCANA } from './deck';
import {
  DEFAULT_SPREAD_POSITIONS,
  createSeededRng,
  detectObviousAmbiguity,
  drawSpread,
  orientationLabelRu,
  validateQuestionText,
} from './spreadEngine';

test('78-card Rider-Waite deck integrity check', () => {
  assert.equal(MAJOR_ARCANA.length, 22, 'Expected 22 Major Arcana cards');
  assert.equal(MINOR_ARCANA.length, 56, 'Expected 56 Minor Arcana cards');
  assert.equal(TAROT_DECK.length, 78, 'Expected full 78-card Tarot deck');

  const uniqueIds = new Set(TAROT_DECK.map((c) => c.id));
  assert.equal(uniqueIds.size, 78, 'All 78 card IDs must be unique');

  const suits = ['major', 'wands', 'cups', 'swords', 'pentacles'] as const;
  for (const suit of suits) {
    const count = TAROT_DECK.filter((c) => c.suit === suit).length;
    assert.equal(count, suit === 'major' ? 22 : 14, `Unexpected count for suit ${suit}`);
  }
});

test('drawSpread draws exact unique cards with valid orientations', () => {
  const rng = createSeededRng(42);
  const drawn = drawSpread({
    positions: DEFAULT_SPREAD_POSITIONS['7-card'],
    reversedProbability: 0.4,
    rng,
  });

  assert.equal(drawn.length, 7);
  const cardIds = new Set(drawn.map((item) => item.card.id));
  assert.equal(cardIds.size, 7, 'Drawn spread must not contain duplicate cards');

  for (const item of drawn) {
    assert.ok(item.orientation === 'upright' || item.orientation === 'reversed');
    assert.ok(orientationLabelRu(item.orientation).length > 0);
  }
});

test('drawSpread is reproducible with identical seed and unbiased across seeds', () => {
  const first = drawSpread({
    positions: DEFAULT_SPREAD_POSITIONS['3-card'],
    rng: createSeededRng(1337),
  });
  const second = drawSpread({
    positions: DEFAULT_SPREAD_POSITIONS['3-card'],
    rng: createSeededRng(1337),
  });
  assert.deepEqual(
    first.map((d) => `${d.card.id}:${d.orientation}`),
    second.map((d) => `${d.card.id}:${d.orientation}`),
  );

  let reversedCount = 0;
  let total = 0;
  for (let seed = 1; seed <= 100; seed += 1) {
    const draw = drawSpread({
      positions: DEFAULT_SPREAD_POSITIONS['5-card'],
      reversedProbability: 0.5,
      rng: createSeededRng(seed),
    });
    for (const d of draw) {
      total += 1;
      if (d.orientation === 'reversed') reversedCount += 1;
    }
  }
  assert.ok(reversedCount > 150 && reversedCount < 350, `Expected balanced orientation ratio, got ${reversedCount}/${total}`);
});

test('validateQuestionText and ambiguity detection enforce clear framing', () => {
  assert.equal(validateQuestionText('').valid, false);
  assert.equal(validateQuestionText('   ').valid, false);
  assert.equal(validateQuestionText('Да').valid, false);
  assert.equal(validateQuestionText('Стоит ли мне менять работу в этом году?').valid, true);

  assert.ok(detectObviousAmbiguity('Что будет дальше?') !== null);
  assert.ok(detectObviousAmbiguity('Будущее') !== null);
  assert.equal(
    detectObviousAmbiguity('Какие скрытые риски есть в моём переходе на новую должность?'),
    null,
  );
});
