import { TAROT_DECK } from './deck';
import type { DrawnCard, Orientation, SpreadPosition, TarotCard } from './types';

export type SpreadType = '3-card' | '5-card' | '7-card';

export const DEFAULT_SPREAD_POSITIONS: Record<SpreadType, SpreadPosition[]> = {
  '3-card': [
    { index: 1, title: 'Суть ситуации', focus: 'Текущее ядро вопроса и видимая динамика' },
    { index: 2, title: 'Скрытый фактор', focus: 'Внутренние мотивы, сомнения или неочевидное влияние' },
    { index: 3, title: 'Вероятный вектор', focus: 'Куда стремится ситуация при сохранении текущей линии' },
  ],
  '5-card': [
    { index: 1, title: 'Ядро вопроса', focus: 'Главная тема и ключевая точка напряжения' },
    { index: 2, title: 'Осознанная позиция', focus: 'Намерения, ожидания и активные шаги' },
    { index: 3, title: 'Тень и противоречия', focus: 'Скрытые мотивы, страхи или внутренний конфликт' },
    { index: 4, title: 'Внешнее влияние', focus: 'Обстоятельства среды, контекст и факторы вне контроля' },
    { index: 5, title: 'Синтез и ориентир', focus: 'Наиболее вероятный вектор развития и фокус внимания' },
  ],
  '7-card': [
    { index: 1, title: 'Исходная точка', focus: 'Фундамент и причины, приведшие к нынешней точке' },
    { index: 2, title: 'Внутреннее состояние', focus: 'Психологический и эмоциональный фон' },
    { index: 3, title: 'Скрытый узел', focus: 'Неочевидное противоречие или слепая зона' },
    { index: 4, title: 'Внешний контекст', focus: 'Реальные условия, ограничения и внешние силы' },
    { index: 5, title: 'Ресурсы и опора', focus: 'На что можно опереться внутри и вовне' },
    { index: 6, title: 'Риски и иллюзии', focus: 'Что способно исказить оценку или затормозить путь' },
    { index: 7, title: 'Перспектива цикла', focus: 'Обобщённый итог и долгосрочная тенденция' },
  ],
};

export interface DrawOptions {
  positions: SpreadPosition[];
  reversedProbability?: number;
  rng?: () => number;
  deck?: TarotCard[];
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function defaultSecureRng(): number {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  }
  return Math.random();
}

export function drawSpread(options: DrawOptions): DrawnCard[] {
  const {
    positions,
    reversedProbability = 0.4,
    rng = defaultSecureRng,
    deck = TAROT_DECK,
  } = options;

  if (positions.length === 0) {
    throw new Error('Расклад должен содержать хотя бы одну позицию.');
  }
  if (positions.length > deck.length) {
    throw new Error(`Невозможно вытянуть ${positions.length} карт из колоды из ${deck.length} карт.`);
  }

  const pool = [...deck];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return positions.map((position, idx) => {
    const card = pool[idx];
    const orientation: Orientation = rng() < reversedProbability ? 'reversed' : 'upright';
    return {
      position,
      card,
      orientation,
    };
  });
}

export function orientationLabelRu(orientation: Orientation): string {
  return orientation === 'upright' ? 'Прямое положение' : 'Перевёрнутое положение';
}

export function orientationShortRu(orientation: Orientation): string {
  return orientation === 'upright' ? 'Прямая' : 'Перевёрнутая';
}

export function validateQuestionText(question: string): { valid: boolean; error?: string } {
  const trimmed = question.trim();
  if (!trimmed) {
    return { valid: false, error: 'Пожалуйста, сформулируйте ваш вопрос перед началом расклада.' };
  }
  if (trimmed.length < 4) {
    return { valid: false, error: 'Вопрос слишком короткий — опишите ситуацию хотя бы в нескольких словах.' };
  }
  if (trimmed.length > 1500) {
    return { valid: false, error: 'Формулировка слишком длинная — сократите вопрос до 1500 символов.' };
  }
  return { valid: true };
}

export function detectObviousAmbiguity(question: string): string | null {
  const normalized = question.trim().toLowerCase().replace(/[?!.,;:]+/g, ' ').trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return 'Уточните, пожалуйста, о какой именно сфере жизни (отношения, работа, финансы, внутреннее состояние или выбор) идёт речь и какой период времени вас интересует?';
  }
  const vaguePatterns = [
    /^что будет дальше$/,
    /^что меня ждёт$/,
    /^как сложится$/,
    /^расскажи про будущее$/,
    /^погадай мне$/,
    /^сделай расклад$/,
  ];
  if (vaguePatterns.some((pattern) => pattern.test(normalized))) {
    return 'Вопрос сформулирован очень широко. Какая конкретная ситуация или выбор сейчас занимает ваши мысли больше всего?';
  }
  return null;
}
