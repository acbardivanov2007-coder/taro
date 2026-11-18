import { useState, type FormEvent } from 'react';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import { analyzeSpreadStructure } from '../tarot/spreadAnalytics';
import type { DeepenedAnalysis, DrawnCard, TarotInterpretation } from '../tarot/types';
import { CelestialDivider } from './CelestialDivider';

interface InterpretationReportProps {
  interpretation: TarotInterpretation;
  drawnCards: DrawnCard[];
  deepenedAnalyses?: DeepenedAnalysis[];
  isDeepening?: boolean;
  deepenError?: string | null;
  onDeepen?: (focusAngle: string) => void;
}

const DEEPEN_PRESETS = [
  'Рассмотреть скрытые психологические защиты и внутренний конфликт между разумом и чувствами',
  'Сфокусироваться на неочевидных символах изображений и связях между несоседними картами',
  'Разобрать практическую сторону: что в ситуации зависит от моих действий, а что — нет',
];

export function InterpretationReport({
  interpretation,
  drawnCards,
  deepenedAnalyses = [],
  isDeepening = false,
  deepenError = null,
  onDeepen,
}: InterpretationReportProps) {
  const [focusInput, setFocusInput] = useState('');
  const structure = analyzeSpreadStructure(drawnCards);

  function handleDeepenSubmit(e: FormEvent) {
    e.preventDefault();
    if (!onDeepen || isDeepening) return;
    onDeepen(focusInput.trim());
    setFocusInput('');
  }

  return (
    <section aria-label="Полная интерпретация расклада" className="mt-10 pt-2">
      <CelestialDivider variant="lunar" />

      <div className="mx-auto max-w-3xl space-y-10">
        {/* 1. Общая характеристика расклада */}
        <div>
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">01 · Общая характеристика</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            1. Общая характеристика расклада
          </h2>
          <p className="mt-4 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
            {interpretation.overview}
          </p>
        </div>

        {/* 2. Выпавшие карты */}
        <div className="border-t border-[#2D2337] pt-8">
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">02 · Фиксация карт</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            2. Выпавшие карты
          </h2>
          <ol className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-[#D8D0E0]">
            {(interpretation.cardsListSummary.length > 0
              ? interpretation.cardsListSummary
              : drawnCards.map(
                  (d) =>
                    `${d.position.index}. ${d.position.title} — ${d.card.nameRu} (${
                      d.orientation === 'upright' ? 'прямое положение' : 'перевёрнутое положение'
                    })`,
                )
            ).map((line, index) => (
              <li key={index} className="flex items-baseline gap-3 border-b border-[#241B2D] pb-2 last:border-b-0">
                <span className="font-mono text-xs tabular-nums text-[#C9A86A]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 3. Углублённый разбор каждой карты */}
        <div className="border-t border-[#2D2337] pt-8">
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">03 · Углублённый анализ позиций</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            3. Подробный разбор каждой карты
          </h2>

          <div className="mt-6 space-y-8">
            {interpretation.cardAnalyses.map((item, idx) => {
              const matchedDraw = drawnCards[idx];
              const isRev = item.orientationLabel.toLowerCase().includes('перевёрн');
              return (
                <article
                  key={`${item.positionIndex}-${item.cardName}`}
                  className="rounded-md border border-[#342840] bg-[#14101B] p-6 sm:p-7"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#2D2337] pb-3.5">
                    <h3 className="font-serif text-2xl font-semibold text-[#EFE8DC]">
                      {item.positionIndex}. {item.cardName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#9A8FA6]">
                      {matchedDraw && (
                        <>
                          <span>{matchedDraw.position.title}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className={isRev ? 'font-medium text-[#E092A0]' : 'font-medium text-[#D4B475]'}>
                        {item.orientationLabel}
                      </span>
                    </div>
                  </header>

                  <dl className="mt-5 space-y-5 text-[15px] leading-[1.72] text-[#D8D0E0]">
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-[#C9A86A]">
                        Классическое значение и визуальная символика
                      </dt>
                      <dd className="mt-1.5 space-y-2">
                        <p>{item.classicalMeaning}</p>
                        {item.visualSymbolism && (
                          <p className="text-[#BFB5CA]">
                            <strong className="font-medium text-[#EFE8DC]">Детали изображения:</strong>{' '}
                            {item.visualSymbolism}
                          </p>
                        )}
                        {item.archetypeAndNumerology && (
                          <p className="text-[#BFB5CA]">
                            <strong className="font-medium text-[#EFE8DC]">Архетип, число и стихия:</strong>{' '}
                            {item.archetypeAndNumerology}
                          </p>
                        )}
                      </dd>
                    </div>

                    <div className="border-t border-[#261D30] pt-4">
                      <dt className="text-xs font-semibold tracking-wide text-[#C9A86A]">
                        Значение в контексте вашего вопроса
                      </dt>
                      <dd className="mt-1.5 space-y-2">
                        <p>{item.contextMeaning}</p>
                        {item.alternativeInterpretations && (
                          <p className="text-[#BFB5CA]">
                            <strong className="font-medium text-[#EFE8DC]">Альтернативные оттенки смысла:</strong>{' '}
                            {item.alternativeInterpretations}
                          </p>
                        )}
                      </dd>
                    </div>

                    <div className="border-t border-[#261D30] pt-4">
                      <dt className="text-xs font-semibold tracking-wide text-[#C9A86A]">
                        Глубинный психологический разбор и противоречия
                      </dt>
                      <dd className="mt-1.5 space-y-2">
                        <p>{item.psychologicalSubtext}</p>
                        {item.consciousVsSubconscious && (
                          <p className="text-[#BFB5CA]">
                            <strong className="font-medium text-[#EFE8DC]">
                              Сознательный и подсознательный уровни:
                            </strong>{' '}
                            {item.consciousVsSubconscious}
                          </p>
                        )}
                        <p className="text-[#BFB5CA]">
                          <strong className="font-medium text-[#EFE8DC]">Скрытые мотивы и конфликт:</strong>{' '}
                          {item.hiddenMotivesAndConflicts}
                        </p>
                      </dd>
                    </div>

                    <div className="grid gap-4 border-t border-[#261D30] pt-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-[#D4B475]">
                          Конструктивные и теневые стороны
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#C8BFD1]">
                          {item.positiveAndNegativeSides}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[#E092A0]">
                          Роль прямого или перевёрнутого положения
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[#C8BFD1]">
                          {item.orientationSignificance}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </div>

        <CelestialDivider variant="constellation" />

        {/* 4. Взаимодействие карт */}
        <div>
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">04 · Сочетания и динамика</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            4. Взаимодействие карт
          </h2>
          <p className="mt-4 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
            {interpretation.interactions}
          </p>
        </div>

        {/* 5. Анализ расклада как единой системы */}
        <div className="border-t border-[#2D2337] pt-8">
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">05 · Системная структура</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            5. Анализ расклада как единой системы
          </h2>

          {/* Unboxed factual telemetry strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-[#2D2337] py-3 text-xs text-[#A99FB2]">
            <span className="font-mono tabular-nums text-[#EFE8DC]">
              Старшие/Младшие: {structure.majorCount}/{structure.minorCount}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Прямые/Перевёрнутые: {structure.uprightCount}/{structure.reversedCount}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Повторы мастей: {structure.repeatingSuits.length > 0 ? structure.repeatingSuits.join(', ') : 'нет'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Повторы чисел:{' '}
              {structure.repeatingNumbers.length > 0
                ? structure.repeatingNumbers.map((n) => `${n.label}`).join(', ')
                : 'нет'}
            </span>
            {structure.courtCards.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>Придворные карты: {structure.courtCards.join(', ')}</span>
              </>
            )}
          </div>

          {interpretation.systemicAnalysis && (
            <p className="mt-4 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
              {interpretation.systemicAnalysis}
            </p>
          )}
        </div>

        {/* 6. Несколько возможных трактовок */}
        {interpretation.alternativeReadings && (
          <div className="border-t border-[#2D2337] pt-8">
            <div className="text-xs font-mono tabular-nums text-[#C9A86A]">06 · Вариативность смыслов</div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
              6. Альтернативные трактовки и сопоставление карт
            </h2>
            <p className="mt-4 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
              {interpretation.alternativeReadings}
            </p>
          </div>
        )}

        <CelestialDivider variant="lunar" />

        {/* 7. Дополнительный итоговый анализ (3 обязательных пункта) */}
        <div className="space-y-6">
          <div className="text-xs font-mono tabular-nums text-[#C9A86A]">07 · Итоговый синтез расклада</div>

          {interpretation.nonObviousMeaning && (
            <div className="border-b border-[#2D2337] pb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#EFE8DC]">Неочевидный смысл</h2>
              <p className="mt-2.5 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
                {interpretation.nonObviousMeaning}
              </p>
            </div>
          )}

          {interpretation.mainContradiction && (
            <div className="border-b border-[#2D2337] pb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#EFE8DC]">Главное противоречие</h2>
              <p className="mt-2.5 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
                {interpretation.mainContradiction}
              </p>
            </div>
          )}

          {/* Главный вывод — визуально выделенный блок */}
          <div className="rounded-md border border-[#C9A86A]/45 bg-[#171220] p-6 sm:p-7">
            <div className="text-xs font-mono text-[#D4B475]">Ключевой итог</div>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
              Главный вывод
            </h2>
            <p className="mt-3 text-base leading-[1.78] text-[#EFE8DC] whitespace-pre-line">
              {interpretation.mainConclusion}
            </p>
          </div>
        </div>

        {/* 8. То, на что стоит обратить внимание */}
        <div className="border-t border-[#2D2337] pt-8">
          <div className="text-xs font-mono tabular-nums text-[#E092A0]">08 · Риски и оговорки</div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
            То, на что стоит обратить внимание
          </h2>
          <p className="mt-4 text-[15px] sm:text-base leading-[1.75] text-[#D8D0E0] whitespace-pre-line">
            {interpretation.attentionPoints}
          </p>
          <p className="mt-5 border-t border-[#241B2D] pt-4 text-xs leading-relaxed text-[#9A8FA6]">
            Примечание: Таро представляет собой символическую систему интерпретации, а не научно доказанный
            способ предсказания будущего или чтения мыслей других людей. Окончательные решения всегда остаются
            за вами.
          </p>
        </div>

        {/* 9. Повторный углублённый анализ без вытягивания новых карт */}
        {onDeepen && (
          <div className="border-t border-[#3B2E46] pt-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#C9A86A]">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Повторный анализ · Без вытягивания новых карт</span>
            </div>
            <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-semibold text-[#EFE8DC]">
              Углубить разбор этого расклада
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#A99FB2]">
              Выпавшие карты остаются прежними. Можно рассмотреть их с иной стороны, раскрыть незамеченные детали
              символики или сфокусироваться на конкретном вопросе по этому же раскладу.
            </p>

            {/* Render previously completed follow-up analyses */}
            {deepenedAnalyses.length > 0 && (
              <div className="mt-6 space-y-6">
                {deepenedAnalyses.map((item, idx) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-[#3B2E46] bg-[#14101B] p-6"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#2D2337] pb-3">
                      <span className="font-serif text-xl font-semibold text-[#DFC186]">
                        Повторный разбор #{idx + 1}
                      </span>
                      <span className="text-xs text-[#9A8FA6]">{item.focusAngle}</span>
                    </div>
                    <dl className="mt-4 space-y-4 text-[15px] leading-[1.72] text-[#D8D0E0]">
                      <div>
                        <dt className="text-xs font-semibold text-[#C9A86A]">Новый ракурс на расклад</dt>
                        <dd className="mt-1">{item.newPerspective}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[#C9A86A]">
                          Нераскрытые символы и переклички
                        </dt>
                        <dd className="mt-1">{item.unexploredSymbolsAndPairings}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[#C9A86A]">
                          Углублённый психологический подтекст
                        </dt>
                        <dd className="mt-1">{item.deepenedPsychology}</dd>
                      </div>
                      <div className="border-t border-[#2D2337] pt-3">
                        <dt className="text-xs font-semibold text-[#E092A0]">Уточнённый вывод</dt>
                        <dd className="mt-1 text-[#EFE8DC]">{item.refinedSynthesis}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}

            <form onSubmit={handleDeepenSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="deepen-focus-input" className="block text-xs font-medium text-[#A99FB2]">
                  Уточните фокус повторного анализа (необязательно — можно оставить пустым для общего углубления)
                </label>
                <input
                  id="deepen-focus-input"
                  type="text"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  disabled={isDeepening}
                  placeholder="Например: Разберите подробнее внутренний конфликт в позициях 2 и 4"
                  className="mt-2 w-full rounded-md border border-[#3B2E46] bg-[#14101B] px-4 py-2.5 text-sm text-[#EFE8DC] placeholder:text-[#7E738A] focus:border-[#C9A86A] focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                {DEEPEN_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isDeepening}
                    onClick={() => setFocusInput(preset)}
                    className="text-left text-xs text-[#A99FB2] hover:text-[#DFC186] underline decoration-[#3B2E46] underline-offset-4 cursor-pointer disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {deepenError && (
                <p role="alert" className="text-xs font-medium text-[#E092A0]">
                  {deepenError}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isDeepening}
                  className="inline-flex items-center gap-2 rounded-md bg-[#6B1D2F] px-5 py-2.5 text-sm font-medium text-[#FAF4EA] hover:bg-[#7E2439] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isDeepening ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Углубляю анализ тех же карт…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>Углубить разбор без новых карт</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
