import { useEffect, useState, type FormEvent } from 'react';
import { Lock, RotateCcw, AlertCircle, Loader2, ArrowRight, Moon } from 'lucide-react';
import { CardDetailModal } from './components/CardDetailModal';
import { DeckExplorer } from './components/DeckExplorer';
import { HistoryView } from './components/HistoryView';
import { InterpretationReport } from './components/InterpretationReport';
import { PrinciplesView } from './components/PrinciplesView';
import { TarotCardPlate } from './components/TarotCardPlate';
import { validateQuestionText } from './tarot/spreadEngine';
import type {
  ConsultationSession,
  DeepenedAnalysis,
  DrawnCard,
  Orientation,
  SpreadAssessmentResponse,
  TarotCard,
  TarotInterpretation,
} from './tarot/types';

type ActiveTab = 'consultation' | 'deck' | 'history' | 'principles';
type ConsultationPhase =
  | 'idle'
  | 'assessing'
  | 'needs_clarification'
  | 'interpreting'
  | 'complete'
  | 'error';

const HISTORY_STORAGE_KEY = 'arcanum_tarot_history_v1';
const HERO_TABLE_URL = '/src/assets/images/gothic_tarot_table_1795036178651.jpg';

const SAMPLE_QUESTIONS = [
  'Стоит ли мне переходить на новую должность в ближайшие три месяца или лучше укрепить текущую позицию?',
  'Почему в последнее время в наших отношениях возникает ощущение дистанции и недосказанности, и что на это влияет с обеих сторон?',
  'Что будет дальше?',
];

interface SelectedCardModalState {
  card: TarotCard;
  orientation: Orientation;
  positionTitle?: string;
}

function loadHistory(): ConsultationSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('consultation');
  const [phase, setPhase] = useState<ConsultationPhase>('idle');

  const [questionInput, setQuestionInput] = useState('');
  const [activeQuestion, setActiveQuestion] = useState('');
  const [clarifyingQuestion, setClarifyingQuestion] = useState('');
  const [clarificationReason, setClarificationReason] = useState('');
  const [clarificationInput, setClarificationInput] = useState('');
  const [activeClarificationAnswer, setActiveClarificationAnswer] = useState('');

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [spreadName, setSpreadName] = useState('');
  const [spreadType, setSpreadType] = useState<'3-card' | '5-card' | '7-card'>('3-card');
  const [spreadRationale, setSpreadRationale] = useState('');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [interpretation, setInterpretation] = useState<TarotInterpretation | null>(null);
  const [deepenedAnalyses, setDeepenedAnalyses] = useState<DeepenedAnalysis[]>([]);
  const [isDeepening, setIsDeepening] = useState(false);
  const [deepenError, setDeepenError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  const [history, setHistory] = useState<ConsultationSession[]>(() => loadHistory());
  const [modalCard, setModalCard] = useState<SelectedCardModalState | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  function resetConsultation() {
    setActiveTab('consultation');
    setPhase('idle');
    setQuestionInput('');
    setActiveQuestion('');
    setClarifyingQuestion('');
    setClarificationReason('');
    setClarificationInput('');
    setActiveClarificationAnswer('');
    setActiveSessionId(null);
    setSpreadName('');
    setSpreadType('3-card');
    setSpreadRationale('');
    setDrawnCards([]);
    setInterpretation(null);
    setDeepenedAnalyses([]);
    setIsDeepening(false);
    setDeepenError(null);
    setErrorMessage(null);
    setFormValidationError(null);
  }

  async function runInterpretation(params: {
    question: string;
    clarifyingQ?: string;
    clarificationA?: string;
    sName: string;
    sType: '3-card' | '5-card' | '7-card';
    sRationale: string;
    cards: DrawnCard[];
  }) {
    setPhase('interpreting');
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/tarot/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: params.question,
          clarifyingQuestion: params.clarifyingQ || undefined,
          clarificationAnswer: params.clarificationA || undefined,
          spreadName: params.sName,
          spreadRationale: params.sRationale,
          drawnCards: params.cards,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Не удалось получить интерпретацию расклада.');
      }

      const result = data.interpretation as TarotInterpretation;
      const sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

      setInterpretation(result);
      setDeepenedAnalyses([]);
      setDeepenError(null);
      setActiveSessionId(sessionId);
      setPhase('complete');

      const newSession: ConsultationSession = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        question: params.question,
        clarifyingQuestion: params.clarifyingQ || undefined,
        clarificationAnswer: params.clarificationA || undefined,
        spreadName: params.sName,
        spreadType: params.sType,
        spreadRationale: params.sRationale,
        drawnCards: params.cards,
        interpretation: result,
        deepenedAnalyses: [],
      };
      setHistory((prev) => [newSession, ...prev].slice(0, 30));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Произошла ошибка при интерпретации расклада.');
      setPhase('error');
    }
  }

  async function handleDeepen(focusAngle: string) {
    if (!interpretation || drawnCards.length === 0 || isDeepening) return;
    setIsDeepening(true);
    setDeepenError(null);

    try {
      const resp = await fetch('/api/tarot/deepen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuestion,
          clarifyingQuestion: clarifyingQuestion || undefined,
          clarificationAnswer: activeClarificationAnswer || undefined,
          spreadName,
          drawnCards,
          previousInterpretation: interpretation,
          previousDeepened: deepenedAnalyses,
          focusAngle,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Не удалось выполнить повторный анализ расклада.');
      }

      const deepened = data.deepened as DeepenedAnalysis;
      const nextDeepened = [...deepenedAnalyses, deepened];
      setDeepenedAnalyses(nextDeepened);

      if (activeSessionId) {
        setHistory((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? { ...session, deepenedAnalyses: nextDeepened }
              : session,
          ),
        );
      }
    } catch (err) {
      setDeepenError(
        err instanceof Error ? err.message : 'Ошибка при повторном разборе расклада.',
      );
    } finally {
      setIsDeepening(false);
    }
  }

  async function assessAndStart(question: string, clarificationAnswer?: string, prevClarifyingQ?: string) {
    setPhase('assessing');
    setErrorMessage(null);
    setFormValidationError(null);

    try {
      const resp = await fetch('/api/tarot/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          clarificationAnswer: clarificationAnswer || undefined,
          clarifyingQuestion: prevClarifyingQ || undefined,
        }),
      });

      const data = (await resp.json()) as SpreadAssessmentResponse & { error?: string };
      if (!resp.ok) {
        throw new Error(data?.error || 'Не удалось проанализировать вопрос.');
      }

      if (data.status === 'needs_clarification') {
        setClarifyingQuestion(data.clarifyingQuestion);
        setClarificationReason(data.reason);
        setPhase('needs_clarification');
        return;
      }

      setSpreadName(data.spreadName);
      setSpreadType(data.spreadType);
      setSpreadRationale(data.spreadRationale);
      setDrawnCards(data.drawnCards);

      await runInterpretation({
        question,
        clarifyingQ: prevClarifyingQ,
        clarificationA: clarificationAnswer,
        sName: data.spreadName,
        sType: data.spreadType,
        sRationale: data.spreadRationale,
        cards: data.drawnCards,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка соединения с сервером.');
      setPhase('error');
    }
  }

  function handleQuestionSubmit(e: FormEvent) {
    e.preventDefault();
    const check = validateQuestionText(questionInput);
    if (!check.valid) {
      setFormValidationError(check.error || 'Проверьте формулировку вопроса.');
      return;
    }
    const clean = questionInput.trim();
    setActiveQuestion(clean);
    setClarifyingQuestion('');
    setClarificationReason('');
    setClarificationInput('');
    setActiveClarificationAnswer('');
    setActiveSessionId(null);
    setDrawnCards([]);
    setInterpretation(null);
    setDeepenedAnalyses([]);
    setDeepenError(null);
    void assessAndStart(clean);
  }

  function handleClarificationSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = clarificationInput.trim();
    if (trimmed.length < 2) {
      setFormValidationError('Пожалуйста, добавьте краткое уточнение, чтобы продолжить расклад.');
      return;
    }
    setActiveClarificationAnswer(trimmed);
    void assessAndStart(activeQuestion, trimmed, clarifyingQuestion);
  }

  function handleRetry() {
    if (drawnCards.length > 0) {
      void runInterpretation({
        question: activeQuestion,
        clarifyingQ: clarifyingQuestion || undefined,
        clarificationA: activeClarificationAnswer || undefined,
        sName: spreadName,
        sType: spreadType,
        sRationale: spreadRationale,
        cards: drawnCards,
      });
    } else if (activeQuestion) {
      void assessAndStart(
        activeQuestion,
        activeClarificationAnswer || undefined,
        clarifyingQuestion || undefined,
      );
    } else {
      setPhase('idle');
      setErrorMessage(null);
    }
  }

  function handleOpenSession(session: ConsultationSession) {
    setActiveSessionId(session.id);
    setActiveQuestion(session.question);
    setQuestionInput(session.question);
    setClarifyingQuestion(session.clarifyingQuestion || '');
    setActiveClarificationAnswer(session.clarificationAnswer || '');
    setSpreadName(session.spreadName);
    setSpreadType(session.spreadType);
    setSpreadRationale(session.spreadRationale);
    setDrawnCards(session.drawnCards);
    setInterpretation(session.interpretation);
    setDeepenedAnalyses(session.deepenedAnalyses ?? []);
    setDeepenError(null);
    setErrorMessage(null);
    setFormValidationError(null);
    setPhase('complete');
    setActiveTab('consultation');
  }

  function handleDeleteSession(id: string) {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  }

  const spreadGridClass =
    drawnCards.length === 3
      ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto'
      : drawnCards.length === 5
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="min-h-screen bg-[#0B0A0E] text-[#EFE8DC] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-[#2D2337] bg-[#0F0C14]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-8 py-4">
          <button
            type="button"
            onClick={() => setActiveTab('consultation')}
            className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#DFC186] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#EFE8DC] transition-colors"
          >
            Арканум · Таро
          </button>

          <nav aria-label="Основная навигация" className="hidden md:flex items-center gap-6 text-sm font-medium">
            {(
              [
                ['consultation', 'Консультация'],
                ['deck', 'Колода (78)'],
                ['history', `История (${history.length})`],
                ['principles', 'Принципы'],
              ] as const
            ).map(([key, label]) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#DFC186] border-b border-[#C9A86A]'
                      : 'text-[#A99FB2] hover:text-[#EFE8DC]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={resetConsultation}
              className="whitespace-nowrap shrink-0 rounded-md bg-[#6B1D2F] border border-[#8F3448]/70 px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF4EA] hover:bg-[#7E2439] transition-colors cursor-pointer"
            >
              Новый вопрос
            </button>
          </div>
        </div>

        {/* Mobile single-row scrollable sub-nav */}
        <nav
          aria-label="Мобильная навигация"
          className="flex md:hidden items-center gap-5 overflow-x-auto border-t border-[#241B2D] px-4 py-2.5 text-xs font-medium"
        >
          {(
            [
              ['consultation', 'Консультация'],
              ['deck', 'Колода (78)'],
              ['history', `История (${history.length})`],
              ['principles', 'Принципы'],
            ] as const
          ).map(([key, label]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap shrink-0 py-0.5 cursor-pointer ${
                  isActive ? 'text-[#DFC186] font-semibold underline underline-offset-4' : 'text-[#A99FB2]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-8 pb-16">
        {activeTab === 'deck' && (
          <DeckExplorer
            onInspectCard={(card) =>
              setModalCard({ card, orientation: 'upright' })
            }
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            sessions={history}
            onOpenSession={handleOpenSession}
            onDeleteSession={handleDeleteSession}
            onStartNew={resetConsultation}
          />
        )}

        {activeTab === 'principles' && <PrinciplesView />}

        {activeTab === 'consultation' && (
          <>
            {/* Phase 1: Initial Ready State — Greeting & Prompt BEFORE drawing any cards */}
            {phase === 'idle' && (
              <section aria-label="Начало консультации" className="py-8 lg:py-12">
                <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
                  <div className="flex flex-col justify-between lg:col-span-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#C9A86A]">
                        <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Система Райдера — Уэйта</span>
                        <span aria-hidden="true">·</span>
                        <span>78 карт</span>
                        <span aria-hidden="true">·</span>
                        <span>Прямое и перевёрнутое положение</span>
                      </div>

                      <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold leading-[1.12] text-[#EFE8DC] text-balance">
                        Я готов к работе. Сформулируйте ваш вопрос
                      </h1>

                      <p className="mt-4 max-w-2xl text-base leading-[1.72] text-[#C8BFD1]">
                        Расклад ещё не открыт: колода из 78 карт перемешивается и выкладывается только после
                        вашего запроса. Если вопрос окажется слишком широким, я сначала попрошу одно
                        уточнение, затем выберу подходящий формат (3 карты для общего запроса или 5–7 карт для
                        сложной ситуации), зафиксирую выпавшие карты и проведу системный разбор.
                      </p>

                      <form onSubmit={handleQuestionSubmit} className="mt-6 space-y-4">
                        <div>
                          <label
                            htmlFor="tarot-question-input"
                            className="block text-xs font-semibold tracking-wide text-[#C9A86A]"
                          >
                            Ваш вопрос для расклада
                          </label>
                          <textarea
                            id="tarot-question-input"
                            rows={4}
                            value={questionInput}
                            onChange={(e) => {
                              setQuestionInput(e.target.value);
                              if (formValidationError) setFormValidationError(null);
                            }}
                            placeholder="Например: Стоит ли мне соглашаться на новое предложение по работе в ближайшие два месяца, и какие скрытые факторы я могу не учитывать?"
                            className="mt-2 w-full rounded-md border border-[#3B2E46] bg-[#14101B] p-4 text-[15px] leading-relaxed text-[#EFE8DC] placeholder:text-[#7E738A] focus:border-[#C9A86A] focus:outline-none"
                          />
                          {formValidationError && (
                            <p role="alert" className="mt-2 text-xs font-medium text-[#E092A0]">
                              {formValidationError}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-md bg-[#6B1D2F] border border-[#8F3448]/70 px-6 py-3 text-sm font-medium text-[#FAF4EA] hover:bg-[#7E2439] transition-colors cursor-pointer"
                          >
                            <span>Провести расклад</span>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="text-xs text-[#9A8FA6]">
                            Случайная выкладка без повторений и подбора под ожидания
                          </span>
                        </div>
                      </form>
                    </div>

                    <div className="mt-8 border-t border-[#2D2337] pt-5">
                      <p className="text-xs font-semibold text-[#C9A86A]">
                        Примеры формулировок (можно подставить в поле выше):
                      </p>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {SAMPLE_QUESTIONS.map((sample, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setQuestionInput(sample);
                              setFormValidationError(null);
                            }}
                            className="text-left text-xs sm:text-sm text-[#BFB5CA] hover:text-[#DFC186] underline decoration-[#3B2E46] underline-offset-4 hover:decoration-[#C9A86A] transition-colors cursor-pointer"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column: dark gothic study table photograph */}
                  <div className="lg:col-span-5 flex flex-col">
                    <figure className="flex h-full flex-col justify-between rounded-md border border-[#342840] bg-[#14101B] p-3">
                      <div className="relative flex-1 overflow-hidden rounded-[4px] bg-[#0B0A0E] min-h-[260px]">
                        {!heroImageError ? (
                          <img
                            src={HERO_TABLE_URL}
                            alt="Тёмный кабинет таролога со свечами, бархатной тканью, астролябией и дневником раскладов"
                            referrerPolicy="no-referrer"
                            onError={() => setHeroImageError(true)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-[#14101B] to-[#23172B] p-6 text-center">
                            <span className="font-serif text-xl italic text-[#C9A86A]">
                              Классическая система Таро Райдера — Уэйта
                            </span>
                          </div>
                        )}
                      </div>
                      <figcaption className="mt-2.5 px-1 text-xs font-serif italic text-[#A99FB2]">
                        Ночной тарологический дневник · Независимая случайная выкладка из 78 карт
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </section>
            )}

            {/* Phase 2: Assessing question clarity */}
            {phase === 'assessing' && (
              <section aria-label="Анализ вопроса" className="mx-auto max-w-2xl py-16 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#C9A86A]" aria-hidden="true" />
                <h2 className="mt-4 font-serif text-3xl font-semibold text-[#EFE8DC]">
                  Анализирую формулировку вопроса…
                </h2>
                <p className="mt-2 text-sm text-[#A99FB2]">
                  Проверяю точность запроса, подбираю позиции и перемешиваю полную колоду из 78 карт.
                </p>
              </section>
            )}

            {/* Phase 3: Ambiguous question -> One clarifying question */}
            {phase === 'needs_clarification' && (
              <section aria-label="Уточняющий вопрос таролога" className="mx-auto max-w-2xl py-10">
                <div className="rounded-md border border-[#3B2E46] bg-[#14101B] p-6 sm:p-8">
                  <div className="text-xs font-medium text-[#C9A86A]">Уточнение запроса</div>
                  <h1 className="mt-1.5 font-serif text-3xl font-semibold text-[#EFE8DC]">
                    Нужен один уточняющий шаг до выкладки карт
                  </h1>
                  <p className="mt-3 text-sm text-[#A99FB2]">
                    Ваш исходный вопрос: <span className="text-[#EFE8DC] font-medium">«{activeQuestion}»</span>
                  </p>

                  <div className="mt-5 border-y border-[#2D2337] py-4">
                    <p className="font-serif text-xl leading-snug text-[#DFC186]">{clarifyingQuestion}</p>
                    {clarificationReason && (
                      <p className="mt-2 text-xs leading-relaxed text-[#A99FB2]">{clarificationReason}</p>
                    )}
                  </div>

                  <form onSubmit={handleClarificationSubmit} className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="clarification-input"
                        className="block text-xs font-semibold tracking-wide text-[#C9A86A]"
                      >
                        Ваше уточнение
                      </label>
                      <textarea
                        id="clarification-input"
                        rows={3}
                        value={clarificationInput}
                        onChange={(e) => {
                          setClarificationInput(e.target.value);
                          if (formValidationError) setFormValidationError(null);
                        }}
                        placeholder="Опишите сферу, контекст или горизонт времени..."
                        className="mt-2 w-full rounded-md border border-[#3B2E46] bg-[#0F0C14] p-3.5 text-[15px] text-[#EFE8DC] placeholder:text-[#7E738A] focus:border-[#C9A86A] focus:outline-none"
                      />
                      {formValidationError && (
                        <p role="alert" className="mt-2 text-xs font-medium text-[#E092A0]">
                          {formValidationError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md bg-[#6B1D2F] border border-[#8F3448]/70 px-5 py-2.5 text-sm font-medium text-[#FAF4EA] hover:bg-[#7E2439] transition-colors cursor-pointer"
                      >
                        <span>Продолжить и вытянуть карты</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={resetConsultation}
                        className="rounded-md border border-[#3B2E46] px-4 py-2.5 text-sm font-medium text-[#C8BFD1] hover:bg-[#1E1728] transition-colors cursor-pointer"
                      >
                        Изменить исходный вопрос
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {/* Phase 4 & 5: Locked Drawn Cards + Deep Interpretation / Error */}
            {(phase === 'interpreting' || phase === 'complete' || phase === 'error') && (
              <section aria-label="Текущий расклад" className="py-8">
                {/* Title & Question Header */}
                <div className="border-b border-[#2D2337] pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#A99FB2]">
                      <Moon className="h-3.5 w-3.5 text-[#C9A86A]" aria-hidden="true" />
                      <span className="font-medium text-[#DFC186]">{spreadName || 'Консультация Таро'}</span>
                      {drawnCards.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{drawnCards.length} карт</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-[#C8BFD1]">
                            <Lock className="h-3 w-3 text-[#C9A86A]" aria-hidden="true" />
                            <span>Карты зафиксированы</span>
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={resetConsultation}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A99FB2] hover:text-[#DFC186] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Новый расклад (новый вопрос)</span>
                    </button>
                  </div>

                  <h1 className="mt-2.5 font-serif text-2xl sm:text-4xl font-semibold leading-snug text-[#EFE8DC] text-balance">
                    «{activeQuestion}»
                  </h1>

                  {activeClarificationAnswer && (
                    <p className="mt-2 text-sm text-[#A99FB2]">
                      Уточнение: <span className="text-[#EFE8DC]">{activeClarificationAnswer}</span>
                    </p>
                  )}

                  {spreadRationale && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A99FB2]">{spreadRationale}</p>
                  )}
                </div>

                {/* Drawn Cards Table */}
                {drawnCards.length > 0 && (
                  <div className="mt-8">
                    <div className="mb-4 flex items-center justify-between text-xs text-[#9A8FA6]">
                      <span>Нажмите на любую карту, чтобы открыть её полную символику и значения</span>
                    </div>
                    <div className={`grid gap-5 ${spreadGridClass}`}>
                      {drawnCards.map((item) => (
                        <TarotCardPlate
                          key={`${item.position.index}-${item.card.id}`}
                          card={item.card}
                          orientation={item.orientation}
                          positionIndex={item.position.index}
                          positionTitle={item.position.title}
                          positionFocus={item.position.focus}
                          onSelect={(card, orientation, positionTitle) =>
                            setModalCard({ card, orientation, positionTitle })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Interpreting State */}
                {phase === 'interpreting' && (
                  <div className="mx-auto mt-10 max-w-2xl rounded-md border border-[#342840] bg-[#14101B] p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#C9A86A]" aria-hidden="true" />
                    <h2 className="mt-3 font-serif text-2xl font-semibold text-[#EFE8DC]">
                      Составляю углублённый разбор расклада…
                    </h2>
                    <p className="mt-1.5 text-sm text-[#A99FB2]">
                      Выпавшие карты зафиксированы. Анализирую символику, нумерологию, системные повторы,
                      альтернативные трактовки и психологический подтекст.
                    </p>
                  </div>
                )}

                {/* Error State */}
                {phase === 'error' && errorMessage && (
                  <div
                    role="alert"
                    className="mx-auto mt-10 max-w-2xl rounded-md border border-[#8F3448] bg-[#1B1118] p-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E092A0]" aria-hidden="true" />
                      <div>
                        <h2 className="font-serif text-xl font-semibold text-[#EFE8DC]">
                          Не удалось завершить обработку расклада
                        </h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#D8D0E0]">{errorMessage}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="rounded-md bg-[#6B1D2F] px-4 py-2 text-xs font-medium text-[#FAF4EA] hover:bg-[#7E2439] cursor-pointer"
                          >
                            Повторить попытку
                          </button>
                          <button
                            type="button"
                            onClick={resetConsultation}
                            className="rounded-md border border-[#3B2E46] px-4 py-2 text-xs font-medium text-[#C8BFD1] hover:bg-[#22192B] cursor-pointer"
                          >
                            Вернуться к началу
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete Report + Repeat Deepen Analysis */}
                {phase === 'complete' && interpretation && (
                  <InterpretationReport
                    interpretation={interpretation}
                    drawnCards={drawnCards}
                    deepenedAnalyses={deepenedAnalyses}
                    isDeepening={isDeepening}
                    deepenError={deepenError}
                    onDeepen={handleDeepen}
                  />
                )}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-[#241B2D] bg-[#0E0B13] py-5">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8 text-xs text-[#9A8FA6]">
          <span>Арканум · Таро · Классическая колода Райдера — Уэйта (78 карт)</span>
          <span>Символическая система интерпретации · Не является прогнозом или доказательством фактов</span>
        </div>
      </footer>

      <CardDetailModal
        card={modalCard?.card ?? null}
        orientation={modalCard?.orientation}
        positionTitle={modalCard?.positionTitle}
        onClose={() => setModalCard(null)}
      />
    </div>
  );
}
