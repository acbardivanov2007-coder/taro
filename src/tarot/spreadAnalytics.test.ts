import test from 'node:test';
import assert from 'node:assert/strict';
import { TAROT_DECK } from './deck';
import { analyzeSpreadStructure } from './spreadAnalytics';
import type { DrawnCard } from './types';

function pickCard(id: string) {
  const card = TAROT_DECK.find((c) => c.id === id);
  if (!card) throw new Error(`Missing card ${id}`);
  return card;
}

test('analyzeSpreadStructure detects Major predominance, repeating suits, repeating numbers, and court cards', () => {
  const drawn: DrawnCard[] = [
    {
      position: { index: 1, title: 'Позиция 1', focus: '' },
      card: pickCard('major-07-chariot'),
      orientation: 'upright',
    },
    {
      position: { index: 2, title: 'Позиция 2', focus: '' },
      card: pickCard('swords-07-seven'),
      orientation: 'reversed',
    },
    {
      position: { index: 3, title: 'Позиция 3', focus: '' },
      card: pickCard('swords-13-queen'),
      orientation: 'upright',
    },
    {
      position: { index: 4, title: 'Позиция 4', focus: '' },
      card: pickCard('major-12-hanged-man'),
      orientation: 'upright',
    },
    {
      position: { index: 5, title: 'Позиция 5', focus: '' },
      card: pickCard('major-17-star'),
      orientation: 'reversed',
    },
  ];

  const summary = analyzeSpreadStructure(drawn);
  assert.equal(summary.totalCards, 5);
  assert.equal(summary.majorCount, 3);
  assert.equal(summary.minorCount, 2);
  assert.equal(summary.uprightCount, 3);
  assert.equal(summary.reversedCount, 2);
  assert.deepEqual(summary.repeatingSuits, ['Мечи (2)']);
  assert.deepEqual(summary.courtCards, ['Королева Мечей']);
  assert.equal(summary.repeatingNumbers.length, 1);
  assert.equal(summary.repeatingNumbers[0].number, 7);
  assert.deepEqual(summary.repeatingNumbers[0].cards, ['Колесница', 'Семёрка Мечей']);
  assert.match(summary.predominanceNote, /Старшие Арканы/);
});
