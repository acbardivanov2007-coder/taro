import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
if (proxyUrl && !process.env.OPENROUTER_API_KEY) {
  try {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log(`[Proxy] Using proxy dispatcher: ${proxyUrl}`);
  } catch (proxyErr) {
    console.error('[Proxy] Failed to configure proxy agent:', proxyErr);
  }
}
import { TAROT_DECK } from './src/tarot/deck.ts';
import { analyzeSpreadStructure } from './src/tarot/spreadAnalytics.ts';
import {
  DEFAULT_SPREAD_POSITIONS,
  detectObviousAmbiguity,
  drawSpread,
  orientationLabelRu,
  validateQuestionText,
  type SpreadType,
} from './src/tarot/spreadEngine.ts';
import type {
  DeepenedAnalysis,
  DrawnCard,
  SpreadPosition,
  TarotInterpretation,
} from './src/tarot/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

const SYSTEM_PERSONA = `Ты — опытный профессиональный таролог и интерпретатор карт Таро с глубоким пониманием классической системы Райдера — Уэйта, визуального символизма, архетипов, нумерологии, стихий, глубинных психологических механизмов и системных взаимосвязей между картами.

ОБЯЗАТЕЛЬНЫЕ ПРИНЦИПЫ РАБОТЫ:
1. Используй строго классическую систему Райдера — Уэйта (78 карт) и её традиционные значения. Не придумывай значения, которых нет в традиции Таро.
2. Будь максимально объективным и не пытайся угодить пользователю. Не подгоняй трактовку под его ожидания, страхи или желания.
3. Не выдавай положительную трактовку ради успокоения и не драматизируй негативные карты, не запугивай.
4. Если расклад противоречивый или допускает несколько трактовок, прямо говори об этом, сопоставляй поддерживающие и противоречащие карты.
5. Не повторяй одно значение карты разными словами, не игнорируй неудобные карты и не подменяй исходный вопрос другим. Если не хватает деталей, не выдумывай их.
6. Никогда не своди толкование к банальностям вроде «всё будет хорошо» или «тебя ждут перемены». Качество, глубина и честность важнее объёма.
7. Когда вопрос затрагивает личность, чувства, отношения или внутренние переживания, предлагай гипотезы для осмысления (страхи, защитные реакции, подавленные желания, конфликт разума и эмоций, разница между желаемым и реальным) — без диагнозов и НИКОГДА не утверждай как факт, что чувствует, думает или считает другой человек.
8. ВАЖНОЕ ПРАВИЛО: Таро — это символическая система интерпретации, а не научно доказанный способ предсказания будущего или чтения мыслей. Используй исключительно гипотетические формулировки: «карта может указывать», «символически это можно прочитать как», «одна из возможных гипотез», «со стороны другого человека это может восприниматься как».
9. Выпавшие карты и их положения (прямое или перевёрнутое) уже зафиксированы и не могут быть изменены.`;

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY не настроен на сервере. Добавьте ключ в файл .env.');
  }
  const httpOptions: Record<string, unknown> = {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  };
  if (process.env.GEMINI_BASE_URL) {
    httpOptions.baseUrl = process.env.GEMINI_BASE_URL;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions,
  });
}

function serverSecureRng(): number {
  return crypto.randomInt(0, 2 ** 32) / 2 ** 32;
}

function extractApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('OPENROUTER_API_KEY')) {
    return { status: 500, message: 'OPENROUTER_API_KEY не настроен. Добавьте ключ в файл .env.' };
  }
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 500, message: raw };
  }
  if (raw.includes('User location is not supported') || raw.includes('FAILED_PRECONDITION')) {
    return {
      status: 400,
      message:
        'Google Gemini API недоступен в вашем регионе. Используйте OpenRouter (добавьте OPENROUTER_API_KEY в .env) — он работает из РФ без VPN.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('401')) {
    return {
      status: 403,
      message: 'Доступ к API нейросети отклонён или ключ недействителен. Проверьте ключ в файле .env.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('Rate limit')) {
    return {
      status: 429,
      message: 'Превышен лимит запросов к нейросети. Повторите попытку через несколько секунд.',
    };
  }
  return {
    status: 502,
    message: `Ошибка обращения к сервису интерпретации: ${raw}`,
  };
}

function normalizeSpreadType(count: number): SpreadType {
  if (count <= 3) return '3-card';
  if (count <= 5) return '5-card';
  return '7-card';
}

function sanitizePositions(
  candidate: Array<{ index?: number; title?: string; focus?: string }> | undefined,
  targetType: SpreadType,
): SpreadPosition[] {
  const expectedCount = targetType === '3-card' ? 3 : targetType === '5-card' ? 5 : 7;
  const fallback = DEFAULT_SPREAD_POSITIONS[targetType];
  if (!Array.isArray(candidate) || candidate.length !== expectedCount) {
    return fallback;
  }
  return candidate.map((item, idx) => ({
    index: idx + 1,
    title: typeof item?.title === 'string' && item.title.trim().length > 0 ? item.title.trim() : fallback[idx].title,
    focus: typeof item?.focus === 'string' && item.focus.trim().length > 0 ? item.focus.trim() : fallback[idx].focus,
  }));
}

const FAST_ASSESS_MODEL = 'gemini-3.1-flash-lite';

async function generateWithBackoff<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const raw = err instanceof Error ? err.message : String(err);
      const isTransient =
        raw.includes('429') ||
        raw.includes('RESOURCE_EXHAUSTED') ||
        raw.includes('503') ||
        raw.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 2500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

function parseModelJson<T>(raw: string): T {
  let clean = raw.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean) as T;
}

async function generateWithOpenRouter(options: {
  systemPrompt?: string;
  userPrompt: string;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY не задан в .env файле.');

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({
    role: 'user',
    content: `${options.userPrompt}\n\nВАЖНО: Ответ ДОЛЖЕН быть строго в формате JSON, без лишнего вступительного текста и без markdown-разметки \`\`\`json.`,
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Arcanum Tarot',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || '{}';
}

const CARD_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    positionIndex: { type: Type.INTEGER },
    cardName: { type: Type.STRING },
    orientationLabel: { type: Type.STRING },
    classicalMeaning: { type: Type.STRING },
    visualSymbolism: { type: Type.STRING },
    archetypeAndNumerology: { type: Type.STRING },
    consciousVsSubconscious: { type: Type.STRING },
    contextMeaning: { type: Type.STRING },
    psychologicalSubtext: { type: Type.STRING },
    hiddenMotivesAndConflicts: { type: Type.STRING },
    alternativeInterpretations: { type: Type.STRING },
    positiveAndNegativeSides: { type: Type.STRING },
    orientationSignificance: { type: Type.STRING },
  },
  required: [
    'positionIndex',
    'cardName',
    'orientationLabel',
    'classicalMeaning',
    'visualSymbolism',
    'archetypeAndNumerology',
    'consciousVsSubconscious',
    'contextMeaning',
    'psychologicalSubtext',
    'hiddenMotivesAndConflicts',
    'alternativeInterpretations',
    'positiveAndNegativeSides',
    'orientationSignificance',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      hasApiKey: Boolean(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY),
      provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'gemini',
    });
  });

  app.post('/api/tarot/assess', async (req, res) => {
    try {
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      const clarificationAnswer =
        typeof req.body?.clarificationAnswer === 'string' ? req.body.clarificationAnswer.trim() : '';
      const clarifyingQuestionPrev =
        typeof req.body?.clarifyingQuestion === 'string' ? req.body.clarifyingQuestion.trim() : '';

      const validation = validateQuestionText(question);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      // If no clarification has been answered yet, catch obviously vague queries immediately
      if (!clarificationAnswer) {
        const quickAmbiguity = detectObviousAmbiguity(question);
        if (quickAmbiguity) {
          res.json({
            status: 'needs_clarification',
            clarifyingQuestion: quickAmbiguity,
            reason: 'Вопрос слишком общий: уточнение позволит подобрать точный расклад и сфокусировать позиции.',
          });
          return;
        }
      }

      const canAskClarification = !clarificationAnswer;

      const assessPrompt = canAskClarification
        ? `Ты опытный таролог системы Райдера — Уэйта. Проанализируй вопрос пользователя для расклада Таро:
Вопрос: "${question}"

1. Определи, является ли вопрос неоднозначным или расплывчатым настолько, что без одного уточняющего вопроса невозможно понять предмет ситуации. Если вопрос уже содержит понятный контекст или сферу (работа, отношения, решение, самопознание и т.п.), уточнение НЕ требуется (needsClarification = false).
2. Если уточнение не нужно, подбери расклад:
   - Для общего или сфокусированного вопроса выбери 3 карты (cardCount = 3).
   - Для сложного, многосоставного или противоречивого вопроса выбери 5 или 7 карт (cardCount = 5 или 7).
3. Сформулируй название расклада на русском, краткое обоснование выбора и точные названия позиций (ровно cardCount штук).`
        : `Ты опытный таролог системы Райдера — Уэйта. Проанализируй вопрос пользователя и его уточнение для расклада Таро. Уточнение уже получено, поэтому needsClarification ДОЛЖНО быть false.
Первоначальный вопрос: "${question}"
Уточняющий вопрос таролога: "${clarifyingQuestionPrev}"
Ответ пользователя: "${clarificationAnswer}"

1. Подбери подходящий расклад: 3 карты для общего вопроса или 5 либо 7 карт для сложного и многогранного.
2. Сформулируй название расклада на русском, краткое обоснование выбора и точные названия позиций (ровно cardCount штук).`;

      let parsed: {
        needsClarification?: boolean;
        clarifyingQuestion?: string;
        reason?: string;
        cardCount?: number;
        spreadName?: string;
        spreadRationale?: string;
        positions?: Array<{ index?: number; title?: string; focus?: string }>;
      };

      if (process.env.OPENROUTER_API_KEY) {
        const raw = await generateWithOpenRouter({
          userPrompt: `${assessPrompt}

Сформируй ответ СТРОГО в виде JSON со следующей структурой:
{
  "needsClarification": boolean,
  "clarifyingQuestion": "...",
  "reason": "...",
  "cardCount": 3,
  "spreadName": "...",
  "spreadRationale": "...",
  "positions": [
    { "index": 1, "title": "...", "focus": "..." }
  ]
}`,
        });
        parsed = parseModelJson(raw);
      } else {
        const ai = createGeminiClient();
        const assessResponse = await generateWithBackoff(() =>
          ai.models.generateContent({
            model: FAST_ASSESS_MODEL,
            contents: assessPrompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  needsClarification: {
                    type: Type.BOOLEAN,
                    description: 'True только если без одного уточняющего вопроса нельзя понять суть ситуации.',
                  },
                  clarifyingQuestion: {
                    type: Type.STRING,
                    description: 'Один вежливый и точный уточняющий вопрос на русском, если needsClarification = true.',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Краткое объяснение, зачем нужно уточнение.',
                  },
                  cardCount: {
                    type: Type.INTEGER,
                    description: 'Количество карт в раскладе: 3, 5 или 7.',
                  },
                  spreadName: {
                    type: Type.STRING,
                    description: 'Название расклада на русском языке.',
                  },
                  spreadRationale: {
                    type: Type.STRING,
                    description: 'Почему выбран именно этот формат расклада (1-2 предложения).',
                  },
                  positions: {
                    type: Type.ARRAY,
                    description: 'Список позиций расклада длиной строго cardCount.',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        index: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        focus: { type: Type.STRING },
                      },
                      required: ['index', 'title', 'focus'],
                    },
                  },
                },
                required: ['needsClarification', 'cardCount', 'spreadName', 'spreadRationale', 'positions'],
              },
            },
          }),
        );
        parsed = parseModelJson(assessResponse.text ?? '{}');
      }

      if (canAskClarification && parsed.needsClarification && parsed.clarifyingQuestion?.trim()) {
        res.json({
          status: 'needs_clarification',
          clarifyingQuestion: parsed.clarifyingQuestion.trim(),
          reason: parsed.reason?.trim() || 'Небольшое уточнение сделает разбор более предметным.',
        });
        return;
      }

      const spreadType = normalizeSpreadType(Number(parsed.cardCount) || 3);
      const positions = sanitizePositions(parsed.positions, spreadType);
      const drawnCards = drawSpread({
        positions,
        reversedProbability: 0.4,
        rng: serverSecureRng,
        deck: TAROT_DECK,
      });

      const defaultName =
        spreadType === '3-card'
          ? 'Расклад трёх карт'
          : spreadType === '5-card'
            ? 'Аналитический расклад из пяти карт'
            : 'Глубокий расклад из семи карт';

      res.json({
        status: 'ready',
        spreadType,
        spreadName: parsed.spreadName?.trim() || defaultName,
        spreadRationale:
          parsed.spreadRationale?.trim() ||
          'Количество и смысл позиций подобраны под масштаб и глубину поставленного вопроса.',
        drawnCards,
      });
    } catch (err) {
      const { status, message } = extractApiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/tarot/interpret', async (req, res) => {
    try {
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      const clarifyingQuestion =
        typeof req.body?.clarifyingQuestion === 'string' ? req.body.clarifyingQuestion.trim() : '';
      const clarificationAnswer =
        typeof req.body?.clarificationAnswer === 'string' ? req.body.clarificationAnswer.trim() : '';
      const spreadName = typeof req.body?.spreadName === 'string' ? req.body.spreadName.trim() : 'Расклад Таро';
      const spreadRationale =
        typeof req.body?.spreadRationale === 'string' ? req.body.spreadRationale.trim() : '';
      const rawDrawn = Array.isArray(req.body?.drawnCards) ? (req.body.drawnCards as DrawnCard[]) : [];

      const validation = validateQuestionText(question);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
      if (rawDrawn.length === 0 || rawDrawn.length > 7) {
        res.status(400).json({ error: 'Передан некорректный набор выпавших карт.' });
        return;
      }

      // Verify every card against the canonical 78-card Rider-Waite deck
      const deckById = new Map(TAROT_DECK.map((card) => [card.id, card]));
      const verifiedCards: DrawnCard[] = [];
      const seenIds = new Set<string>();
      for (let i = 0; i < rawDrawn.length; i += 1) {
        const item = rawDrawn[i];
        const canonical = item?.card?.id ? deckById.get(item.card.id) : undefined;
        if (!canonical || seenIds.has(canonical.id)) {
          res.status(400).json({ error: 'Обнаружено нарушение целостности колоды в раскладе.' });
          return;
        }
        seenIds.add(canonical.id);
        const orientation = item.orientation === 'reversed' ? 'reversed' : 'upright';
        verifiedCards.push({
          position: {
            index: i + 1,
            title: item.position?.title || `Позиция ${i + 1}`,
            focus: item.position?.focus || '',
          },
          card: canonical,
          orientation,
        });
      }

      const structure = analyzeSpreadStructure(verifiedCards);
      const structureFacts = `ОБЪЕКТИВНАЯ СТРУКТУРА РАСКЛАДА:
- Всего карт: ${structure.totalCards} (Старших Арканов: ${structure.majorCount}, Младших Арканов: ${structure.minorCount})
- Баланс положений: прямых — ${structure.uprightCount}, перевёрнутых — ${structure.reversedCount}
- Распределение по стихиям: Огонь — ${structure.elementCounts['Огонь']}, Вода — ${structure.elementCounts['Вода']}, Воздух — ${structure.elementCounts['Воздух']}, Земля — ${structure.elementCounts['Земля']}
- Повторяющиеся масти: ${structure.repeatingSuits.length ? structure.repeatingSuits.join(', ') : 'нет'}
- Повторяющиеся числа: ${structure.repeatingNumbers.length ? structure.repeatingNumbers.map((n) => `${n.label}: ${n.cards.join(', ')}`).join('; ') : 'нет'}
- Придворные карты: ${structure.courtCards.length ? structure.courtCards.join(', ') : 'нет'}
- Преобладание: ${structure.predominanceNote}`;

      const cardsDescription = verifiedCards
        .map(
          (d) =>
            `${d.position.index}. Позиция «${d.position.title}» (${d.position.focus}): ${d.card.nameRu} (${d.card.nameEn}), номер/ранг: ${d.card.roman} (${d.card.number}), аркан: ${d.card.arcana === 'major' ? 'Старший' : 'Младший'}, масть/стихия: ${d.card.element} — ${orientationLabelRu(d.orientation)}. Архетип: ${d.card.archetype}. Символика Райдера — Уэйта: ${d.card.symbolism}.`,
        )
        .join('\n');

      const contextBlock = clarificationAnswer
        ? `Точный первоначальный вопрос пользователя: "${question}"
Уточняющий вопрос таролога: "${clarifyingQuestion}"
Уточнение пользователя: "${clarificationAnswer}"`
        : `Точный первоначальный вопрос пользователя: "${question}"`;

      const interpretPrompt = `Выполни глубокий, но предельно ёмкий профессиональный разбор расклада Таро (система Райдера — Уэйта). Строго держи фокус на первоначальном вопросе, не подменяй его и не додумывай отсутствующие факты.
ПРАВИЛО ЛАКОНИЧНОСТИ: качество и точность важнее длины! Внутри "cardAnalyses" на каждое поле пиши 1–2 плотных, информативных предложения без повторов. На общие разделы пиши 2–3 ёмких предложения.

${contextBlock}
Название расклада: ${spreadName}
Обоснование формата: ${spreadRationale}

${structureFacts}

ВЫПАВШИЕ И ЗАФИКСИРОВАННЫЕ КАРТЫ (менять нельзя):
${cardsDescription}

Заполни JSON-поля разбора:
1. "overview": какую тему затрагивает расклад и какое общее впечатление создают карты.
2. "cardAnalyses": массив ровно из ${verifiedCards.length} объектов по порядку от 1 до ${verifiedCards.length}. Для каждой карты:
   - positionIndex, cardName (на русском), orientationLabel ("Прямое положение" или "Перевёрнутое положение");
   - classicalMeaning: классическое значение Райдера — Уэйта;
   - visualSymbolism: ключевые детали изображения и их смысл для вопроса;
   - archetypeAndNumerology: архетип, нумерология, стихия и масть;
   - consciousVsSubconscious: сознательный и подсознательный уровни, внешнее поведение vs внутреннее состояние;
   - contextMeaning: точное значение в контексте вопроса и позиции;
   - psychologicalSubtext: гипотезы (страхи, защиты, подавленные желания, неосознанные ожидания, конфликт разума и эмоций — без диагнозов);
   - hiddenMotivesAndConflicts: внутренние противоречия и скрытые мотивы;
   - alternativeInterpretations: альтернативные прочтения карты и какое ближе к вопросу;
   - positiveAndNegativeSides: конструктивная и теневая стороны;
   - orientationSignificance: роль прямого или перевёрнутого положения.
3. "interactions": как карты усиливают, ослабляют или видоизменяют друг друга, и какую общую историю рассказывает их последовательность.
4. "systemicAnalysis": преобладание Старших/Младших Арканов, повторяющиеся масти и числа, придворные карты, противоположные символы и общая направленность (строго по фактам структуры).
5. "alternativeReadings": альтернативные варианты прочтения расклада целиком (какие карты поддерживают основную версию, какие противоречат, какая убедительнее).
6. "nonObviousMeaning" (Неочевидный смысл): что скрытое открывается при сопоставлении деталей и позиций.
7. "mainContradiction" (Главное противоречие): ключевые внутренние или внешние противоречия в раскладе.
8. "mainConclusion" (Главный вывод): центральная мысль и честный ответ на первоначальный вопрос.
9. "attentionPoints" (То, на что стоит обратить внимание): скрытые риски, слепые зоны и напоминание о символической природе Таро.`;

      let parsed: Omit<TarotInterpretation, 'cardsListSummary'>;

      if (process.env.OPENROUTER_API_KEY) {
        const raw = await generateWithOpenRouter({
          systemPrompt: SYSTEM_PERSONA,
          userPrompt: `${interpretPrompt}

ВАЖНО: Верни ответ СТРОГО в виде JSON со следующей структурой:
{
  "overview": "общий обзор ситуации",
  "cardAnalyses": [
    {
      "positionIndex": 1,
      "cardName": "Название карты",
      "orientationLabel": "Прямое положение или Перевёрнутое положение",
      "classicalMeaning": "классическое значение Райдера — Уэйта",
      "visualSymbolism": "символизм",
      "archetypeAndNumerology": "архетип и нумерология",
      "consciousVsSubconscious": "сознательное и подсознательное",
      "contextMeaning": "контекстное значение",
      "psychologicalSubtext": "психологический подтекст",
      "hiddenMotivesAndConflicts": "скрытые мотивы",
      "alternativeInterpretations": "альтернативные прочтения",
      "positiveAndNegativeSides": "светлая и теневая стороны",
      "orientationSignificance": "значение ориентации"
    }
  ],
  "interactions": "взаимодействие карт",
  "systemicAnalysis": "системный анализ стихий и мастей",
  "alternativeReadings": "альтернативные варианты",
  "nonObviousMeaning": "неочевидный смысл",
  "mainContradiction": "главное противоречие",
  "mainConclusion": "главный вывод",
  "attentionPoints": "точки внимания"
}`,
        });
        parsed = parseModelJson(raw);
      } else {
        const ai = createGeminiClient();
        const response = await generateWithBackoff(() =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: interpretPrompt,
            config: {
              systemInstruction: SYSTEM_PERSONA,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  overview: { type: Type.STRING },
                  cardAnalyses: {
                    type: Type.ARRAY,
                    items: CARD_ANALYSIS_SCHEMA,
                  },
                  interactions: { type: Type.STRING },
                  systemicAnalysis: { type: Type.STRING },
                  alternativeReadings: { type: Type.STRING },
                  nonObviousMeaning: { type: Type.STRING },
                  mainContradiction: { type: Type.STRING },
                  mainConclusion: { type: Type.STRING },
                  attentionPoints: { type: Type.STRING },
                },
                required: [
                  'overview',
                  'cardAnalyses',
                  'interactions',
                  'systemicAnalysis',
                  'alternativeReadings',
                  'nonObviousMeaning',
                  'mainContradiction',
                  'mainConclusion',
                  'attentionPoints',
                ],
              },
            },
          }),
        );
        parsed = parseModelJson((response.text ?? '{}').trim());
      }

      const rawAnalyses = Array.isArray(parsed.cardAnalyses) ? parsed.cardAnalyses : [];
      const cardAnalyses = verifiedCards.map((drawn, idx) => {
        const matched =
          rawAnalyses.find((item) => item.positionIndex === drawn.position.index) ?? rawAnalyses[idx];
        return {
          positionIndex: drawn.position.index,
          cardName: drawn.card.nameRu,
          orientationLabel:
            drawn.orientation === 'upright' ? 'Прямое положение' : 'Перевёрнутое положение',
          classicalMeaning: matched?.classicalMeaning || drawn.card.uprightMeaning,
          visualSymbolism: matched?.visualSymbolism || drawn.card.symbolism,
          archetypeAndNumerology:
            matched?.archetypeAndNumerology || `${drawn.card.archetype} (${drawn.card.element}).`,
          consciousVsSubconscious: matched?.consciousVsSubconscious || '',
          contextMeaning: matched?.contextMeaning || '',
          psychologicalSubtext: matched?.psychologicalSubtext || '',
          hiddenMotivesAndConflicts: matched?.hiddenMotivesAndConflicts || '',
          alternativeInterpretations: matched?.alternativeInterpretations || '',
          positiveAndNegativeSides: matched?.positiveAndNegativeSides || '',
          orientationSignificance: matched?.orientationSignificance || '',
        };
      });

      const cardsListSummary = verifiedCards.map(
        (d) =>
          `${d.position.index}. ${d.position.title} — ${d.card.nameRu} (${orientationLabelRu(d.orientation)})`,
      );

      const interpretation: TarotInterpretation = {
        overview: parsed.overview || '',
        cardsListSummary,
        cardAnalyses,
        interactions: parsed.interactions || '',
        systemicAnalysis: parsed.systemicAnalysis || '',
        alternativeReadings: parsed.alternativeReadings || '',
        nonObviousMeaning: parsed.nonObviousMeaning || '',
        mainContradiction: parsed.mainContradiction || '',
        mainConclusion: parsed.mainConclusion || '',
        attentionPoints: parsed.attentionPoints || '',
      };

      res.json({ interpretation });
    } catch (err) {
      const { status, message } = extractApiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/tarot/deepen', async (req, res) => {
    try {
      const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
      const clarifyingQuestion =
        typeof req.body?.clarifyingQuestion === 'string' ? req.body.clarifyingQuestion.trim() : '';
      const clarificationAnswer =
        typeof req.body?.clarificationAnswer === 'string' ? req.body.clarificationAnswer.trim() : '';
      const spreadName = typeof req.body?.spreadName === 'string' ? req.body.spreadName.trim() : 'Расклад Таро';
      const focusAngle =
        typeof req.body?.focusAngle === 'string' && req.body.focusAngle.trim().length > 0
          ? req.body.focusAngle.trim()
          : 'Рассмотреть уже выпавшие карты с нового ракурса, выявить ранее нераскрытые символы и углубить психологический анализ';
      const rawDrawn = Array.isArray(req.body?.drawnCards) ? (req.body.drawnCards as DrawnCard[]) : [];
      const previousInterpretation = req.body?.previousInterpretation as TarotInterpretation | undefined;
      const previousDeepened = Array.isArray(req.body?.previousDeepened)
        ? (req.body.previousDeepened as DeepenedAnalysis[])
        : [];

      const validation = validateQuestionText(question);
      if (!validation.valid || rawDrawn.length === 0 || rawDrawn.length > 7) {
        res.status(400).json({ error: 'Переданы некорректные данные расклада для повторного анализа.' });
        return;
      }

      const deckById = new Map(TAROT_DECK.map((card) => [card.id, card]));
      const verifiedCards: DrawnCard[] = [];
      const seenIds = new Set<string>();
      for (let i = 0; i < rawDrawn.length; i += 1) {
        const item = rawDrawn[i];
        const canonical = item?.card?.id ? deckById.get(item.card.id) : undefined;
        if (!canonical || seenIds.has(canonical.id)) {
          res.status(400).json({ error: 'Обнаружено нарушение целостности зафиксированных карт.' });
          return;
        }
        seenIds.add(canonical.id);
        verifiedCards.push({
          position: {
            index: i + 1,
            title: item.position?.title || `Позиция ${i + 1}`,
            focus: item.position?.focus || '',
          },
          card: canonical,
          orientation: item.orientation === 'reversed' ? 'reversed' : 'upright',
        });
      }

      const cardsDescription = verifiedCards
        .map(
          (d) =>
            `${d.position.index}. «${d.position.title}»: ${d.card.nameRu} (${d.card.nameEn}) — ${orientationLabelRu(d.orientation)}. Символика: ${d.card.symbolism}. Архетип: ${d.card.archetype}.`,
        )
        .join('\n');

      const priorConclusions = [
        previousInterpretation?.mainConclusion ? `Первичный вывод: ${previousInterpretation.mainConclusion}` : '',
        previousInterpretation?.nonObviousMeaning ? `Первичный неочевидный смысл: ${previousInterpretation.nonObviousMeaning}` : '',
        ...previousDeepened.map((d, idx) => `Повторный разбор #${idx + 1}: ${d.refinedSynthesis}`),
      ]
        .filter(Boolean)
        .join('\n');

      const deepenPrompt = `Проведи ПОВТОРНЫЙ УГЛУБЛЁННЫЙ АНАЛИЗ уже проведённого расклада БЕЗ вытягивания новых карт.

Первоначальный вопрос: "${question}"
${clarificationAnswer ? `Уточняющий вопрос: "${clarifyingQuestion}"\nУточнение: "${clarificationAnswer}"\n` : ''}Расклад: ${spreadName}
Запрос на углубление / фокус нового рассмотрения: "${focusAngle}"

ЗАФИКСИРОВАННЫЕ КАРТЫ (менять или добавлять карты запрещено):
${cardsDescription}

ЧТО УЖЕ БЫЛО СКАЗАНО РАНЕЕ (НЕ повторяй это дословно):
${priorConclusions || 'Первичный анализ уже приведён.'}

ЗАДАЧА ПОВТОРНОГО АНАЛИЗА:
1. "newPerspective": рассмотри те же самые карты с принципиально другой оптикой или со стороны заданного угла внимания (без повтора прежних формулировок).
2. "unexploredSymbolsAndPairings": обрати внимание на ранее нераскрытые детали изображений Райдера — Уэйта, нумерологические переклички, скрытые мосты между несоседними картами.
3. "deepenedPsychology": углуби психологическую и смысловую интерпретацию (внутренние защиты, конфликт между желаемым и реальным, неосознанные ожидания — как гипотезы для размышления).
4. "refinedSynthesis": сформулируй новый, уточнённый вывод по этому раскладу с сохранением верности первоначальному вопросу и символической этике Таро.`;

      let parsed: Omit<DeepenedAnalysis, 'id' | 'createdAt' | 'focusAngle'>;

      if (process.env.OPENROUTER_API_KEY) {
        const raw = await generateWithOpenRouter({
          systemPrompt: SYSTEM_PERSONA,
          userPrompt: `${deepenPrompt}

Верни ответ СТРОГО в виде JSON:
{
  "newPerspective": "...",
  "unexploredSymbolsAndPairings": "...",
  "deepenedPsychology": "...",
  "refinedSynthesis": "..."
}`,
        });
        parsed = parseModelJson(raw);
      } else {
        const ai = createGeminiClient();
        const response = await generateWithBackoff(() =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: deepenPrompt,
            config: {
              systemInstruction: SYSTEM_PERSONA,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  newPerspective: { type: Type.STRING },
                  unexploredSymbolsAndPairings: { type: Type.STRING },
                  deepenedPsychology: { type: Type.STRING },
                  refinedSynthesis: { type: Type.STRING },
                },
                required: [
                  'newPerspective',
                  'unexploredSymbolsAndPairings',
                  'deepenedPsychology',
                  'refinedSynthesis',
                ],
              },
            },
          }),
        );
        parsed = parseModelJson((response.text ?? '{}').trim());
      }

      const deepened: DeepenedAnalysis = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        focusAngle,
        ...parsed,
      };

      res.json({ deepened });
    } catch (err) {
      const { status, message } = extractApiError(err);
      res.status(status).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
