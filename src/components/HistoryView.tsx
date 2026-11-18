import { Trash2, ArrowRight } from 'lucide-react';
import type { ConsultationSession } from '../tarot/types';

interface HistoryViewProps {
  sessions: ConsultationSession[];
  onOpenSession: (session: ConsultationSession) => void;
  onDeleteSession: (id: string) => void;
  onStartNew: () => void;
}

export function HistoryView({
  sessions,
  onOpenSession,
  onDeleteSession,
  onStartNew,
}: HistoryViewProps) {
  return (
    <section aria-label="Архив проведённых раскладов" className="mx-auto max-w-4xl py-8">
      <div className="border-b border-[#2D2337] pb-6">
        <p className="text-xs font-medium text-[#C9A86A]">Архив сессий</p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#EFE8DC]">
          Дневник раскладов
        </h1>
        <p className="mt-2 text-sm text-[#A99FB2]">
          Выпавшие карты и все повторные разборы в каждом сохранённом раскладе зафиксированы и не изменяются.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-md border border-[#2D2337] bg-[#14101B] p-10 text-center">
          <h2 className="font-serif text-2xl font-semibold text-[#EFE8DC]">Дневник пока пуст</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#A99FB2]">
            После того как вы сформулируете вопрос и получите разбор, сессия автоматически сохранится здесь.
          </p>
          <button
            type="button"
            onClick={onStartNew}
            className="mt-5 rounded-md bg-[#6B1D2F] px-5 py-2.5 text-sm font-medium text-[#FAF4EA] hover:bg-[#7E2439] transition-colors cursor-pointer"
          >
            Задать первый вопрос
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sessions.map((session) => {
            const dateStr = new Date(session.createdAt).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const deepenedCount = session.deepenedAnalyses?.length ?? 0;
            return (
              <article
                key={session.id}
                className="rounded-md border border-[#2D2337] bg-[#14101B] p-5 transition-colors hover:border-[#C9A86A]/45"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9A8FA6]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono tabular-nums text-[#C9A86A]">{dateStr}</span>
                    <span aria-hidden="true">·</span>
                    <span>{session.spreadName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{session.drawnCards.length} карт</span>
                    {deepenedCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Углублений: {deepenedCount}</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    aria-label={`Удалить расклад "${session.question}"`}
                    className="rounded p-1.5 text-[#9A8FA6] hover:bg-[#221928] hover:text-[#E092A0] transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-2 font-serif text-xl font-semibold text-[#EFE8DC]">
                  «{session.question}»
                </h2>

                <p className="mt-2 text-sm text-[#BFB5CA]">
                  {session.drawnCards
                    .map(
                      (d) =>
                        `${d.card.nameRu} (${d.orientation === 'reversed' ? 'перевёрнутая' : 'прямая'})`,
                    )
                    .join(' · ')}
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onOpenSession(session)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4B475] hover:underline cursor-pointer"
                  >
                    <span>Открыть полный разбор</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
