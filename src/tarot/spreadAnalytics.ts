import { SUIT_LABELS_RU } from './deck.ts';
import type { DrawnCard, SpreadStructureSummary, TarotElement, TarotSuit } from './types.ts';

function formatMinorRankLabel(num: number): string {
  const labels: Record<number, string> = {
    1: 'Туз (1)',
    2: 'Двойка (2)',
    3: 'Тройка (3)',
    4: 'Четвёрка (4)',
    5: 'Пятёрка (5)',
    6: 'Шестёрка (6)',
    7: 'Семёрка (7)',
    8: 'Восьмёрка (8)',
    9: 'Девятка (9)',
    10: 'Десятка (10)',
    11: 'Паж (11)',
    12: 'Рыцарь (12)',
    13: 'Королева (13)',
    14: 'Король (14)',
  };
  return labels[num] ?? `Число ${num}`;
}

export function analyzeSpreadStructure(drawnCards: DrawnCard[]): SpreadStructureSummary {
  const suitCounts: Record<TarotSuit, number> = {
    major: 0,
    wands: 0,
    cups: 0,
    swords: 0,
    pentacles: 0,
  };

  const elementCounts: Record<TarotElement, number> = {
    Дух: 0,
    Огонь: 0,
    Вода: 0,
    Воздух: 0,
    Земля: 0,
  };

  let majorCount = 0;
  let minorCount = 0;
  let uprightCount = 0;
  let reversedCount = 0;
  const courtCards: string[] = [];
  const numberGroups = new Map<number, string[]>();

  for (const item of drawnCards) {
    const { card, orientation } = item;
    suitCounts[card.suit] += 1;
    elementCounts[card.element] += 1;

    if (card.arcana === 'major') {
      majorCount += 1;
    } else {
      minorCount += 1;
      if (card.number >= 11) {
        courtCards.push(card.nameRu);
      }
    }

    if (orientation === 'upright') {
      uprightCount += 1;
    } else {
      reversedCount += 1;
    }

    const existing = numberGroups.get(card.number) ?? [];
    existing.push(card.nameRu);
    numberGroups.set(card.number, existing);
  }

  const repeatingSuits: string[] = [];
  (['wands', 'cups', 'swords', 'pentacles'] as const).forEach((suit) => {
    if (suitCounts[suit] >= 2) {
      repeatingSuits.push(`${SUIT_LABELS_RU[suit]} (${suitCounts[suit]})`);
    }
  });

  const repeatingNumbers: Array<{ number: number; label: string; cards: string[] }> = [];
  for (const [num, cards] of numberGroups.entries()) {
    if (cards.length >= 2) {
      repeatingNumbers.push({
        number: num,
        label: formatMinorRankLabel(num),
        cards,
      });
    }
  }
  repeatingNumbers.sort((a, b) => a.number - b.number);

  let predominanceNote = 'Баланс Старших и Младших Арканов';
  if (majorCount > minorCount) {
    predominanceNote = `Преобладают Старшие Арканы (${majorCount} из ${drawnCards.length}) — ключевые смысловые и архетипические узлы`;
  } else if (minorCount > majorCount && majorCount === 0) {
    predominanceNote = 'Все карты — Младшие Арканы: акцент на повседневной динамике, поступках и личном выборе';
  } else if (minorCount > majorCount) {
    predominanceNote = `Преобладают Младшие Арканы (${minorCount} из ${drawnCards.length}) — ситуация решается на уровне конкретных действий и реакций`;
  }

  return {
    totalCards: drawnCards.length,
    majorCount,
    minorCount,
    uprightCount,
    reversedCount,
    suitCounts,
    repeatingSuits,
    repeatingNumbers,
    courtCards,
    elementCounts,
    predominanceNote,
  };
}
