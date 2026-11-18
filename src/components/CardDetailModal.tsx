import { useEffect } from 'react';
import { X, ArrowUp, RotateCcw } from 'lucide-react';
import { SUIT_LABELS_RU } from '../tarot/deck';
import type { Orientation, TarotCard } from '../tarot/types';
import { CardSymbolSvg } from './CardSymbolSvg';

interface CardDetailModalProps {
  card: TarotCard | null;
  orientation?: Orientation;
  positionTitle?: string;
  onClose: () => void;
}

export function CardDetailModal({ card, orientation = 'upright', positionTitle, onClose }: CardDetailModalProps) {
  useEffect(() => {
    if (!card) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [card, onClose]);

  if (!card) return null;

  const isReversed = orientation === 'reversed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#3B2E46] bg-[#14101B] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2D2337] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9A8FA6]">
              <span className="font-mono tabular-nums text-[#C9A86A]">{card.roman}</span>
              <span aria-hidden="true">·</span>
              <span>{SUIT_LABELS_RU[card.suit]}</span>
              <span aria-hidden="true">·</span>
              <span>Стихия: {card.element}</span>
              {positionTitle && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#D4B475] font-medium">Позиция: {positionTitle}</span>
                </>
              )}
            </div>
            <h2 id="card-modal-title" className="mt-1 font-serif text-3xl font-semibold text-[#EFE8DC]">
              {card.nameRu}
            </h2>
            <p className="text-sm text-[#A99FB2]">{card.nameEn}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть описание карты"
            className="rounded-md p-2 text-[#A99FB2] hover:bg-[#221B2D] hover:text-[#EFE8DC] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-md border border-[#C9A86A]/30 bg-[#181320] p-5">
            <div className={isReversed ? 'rotate-180 transition-transform' : ''}>
              <CardSymbolSvg card={card} className="h-24 w-24" />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              {isReversed ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-[#E092A0]" />
                  <span className="text-[#E092A0]">Перевёрнутое положение</span>
                </>
              ) : (
                <>
                  <ArrowUp className="h-3.5 w-3.5 text-[#D4B475]" />
                  <span className="text-[#D4B475]">Прямое положение</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-[#C8BFD1]">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#C9A86A]">Архетип</h3>
              <p className="mt-1 font-serif text-lg text-[#EFE8DC]">{card.archetype}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-[#C9A86A]">
                Классическая символика (Райдер — Уэйт)
              </h3>
              <p className="mt-1">{card.symbolism}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 border-t border-[#2D2337] pt-6 sm:grid-cols-2">
          <div
            className={`rounded-md p-4 ${
              !isReversed ? 'bg-[#1B1524] border border-[#C9A86A]/45' : 'bg-[#120E18]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4B475]">
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Прямое положение</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#D8D0E0]">{card.uprightMeaning}</p>
            <p className="mt-2.5 text-xs text-[#9A8FA6]">
              Ключевые акценты: {card.uprightKeywords.join(' · ')}
            </p>
          </div>

          <div
            className={`rounded-md p-4 ${
              isReversed ? 'bg-[#1F131B] border border-[#8F3448]/60' : 'bg-[#120E18]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E092A0]">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Перевёрнутое положение</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#D8D0E0]">{card.reversedMeaning}</p>
            <p className="mt-2.5 text-xs text-[#9A8FA6]">
              Ключевые акценты: {card.reversedKeywords.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
