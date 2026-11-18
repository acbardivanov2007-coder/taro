import { RotateCcw, ArrowUp } from 'lucide-react';
import { SUIT_LABELS_RU } from '../tarot/deck';
import type { Orientation, TarotCard } from '../tarot/types';
import { CardSymbolSvg } from './CardSymbolSvg';

const CARD_BACK_URL = '/src/assets/images/gothic_card_back_1795036179809.jpg';

interface TarotCardPlateProps {
  card: TarotCard;
  orientation?: Orientation;
  positionIndex?: number;
  positionTitle?: string;
  positionFocus?: string;
  faceDown?: boolean;
  onSelect?: (card: TarotCard, orientation: Orientation, positionTitle?: string) => void;
  compact?: boolean;
}

export function TarotCardPlate({
  card,
  orientation = 'upright',
  positionIndex,
  positionTitle,
  positionFocus,
  faceDown = false,
  onSelect,
  compact = false,
}: TarotCardPlateProps) {
  const isReversed = orientation === 'reversed';

  return (
    <article className="flex flex-col">
      {positionIndex !== undefined && positionTitle && (
        <div className="mb-2.5 min-h-[2.75rem]">
          <div className="flex items-baseline gap-2 text-xs text-[#A99FB2]">
            <span className="font-mono tabular-nums text-[#C9A86A] font-medium">
              {String(positionIndex).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#EFE8DC] leading-snug">{positionTitle}</span>
          </div>
          {positionFocus && !compact && (
            <p className="mt-0.5 text-xs text-[#9A8FA6] leading-relaxed">{positionFocus}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelect?.(card, orientation, positionTitle)}
        aria-label={`${card.nameRu} (${isReversed ? 'Перевёрнутое положение' : 'Прямое положение'})${positionTitle ? ` — ${positionTitle}` : ''}`}
        className="group relative w-full aspect-[3/4] rounded-md border border-[#3B2E46] bg-[#14101B] p-2.5 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#C9A86A]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A] cursor-pointer shadow-[0_6px_22px_rgba(0,0,0,0.45)]"
      >
        {faceDown ? (
          <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-[#0F0C15]">
            <img
              src={CARD_BACK_URL}
              alt="Рубашка карты Таро"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between rounded-[4px] border border-[#C9A86A]/30 bg-[#15111C] p-3">
            {/* Top numeral / element */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono tabular-nums text-[#A99FB2]">
              <span className="text-[#C9A86A]">{card.roman}</span>
              <span className="text-[10px] tracking-wide text-[#B4A7C0]">{card.element}</span>
            </div>

            {/* Central engraving rotated 180deg when reversed */}
            <div
              className={`relative z-10 flex flex-1 items-center justify-center transition-transform duration-200 ${
                isReversed ? 'rotate-180' : ''
              }`}
            >
              <CardSymbolSvg card={card} className={compact ? 'w-14 h-14' : 'w-20 h-20'} />
            </div>

            {/* Bottom title & English traditional name */}
            <div className="relative z-10 border-t border-[#2E2438] pt-2 text-center">
              <div className="font-serif text-base font-semibold leading-tight text-[#EFE8DC] group-hover:text-[#DFC186] transition-colors">
                {card.nameRu}
              </div>
              <div className="mt-0.5 text-[11px] text-[#9A8FA6] truncate">{card.nameEn}</div>
            </div>
          </div>
        )}
      </button>

      {/* Unboxed explicit orientation & suit metadata below plate */}
      {!faceDown && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#9A8FA6]">
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isReversed ? 'text-[#E092A0]' : 'text-[#D4B475]'
            }`}
          >
            {isReversed ? (
              <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>{isReversed ? 'Перевёрнутая' : 'Прямая'}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{SUIT_LABELS_RU[card.suit]}</span>
        </div>
      )}
    </article>
  );
}
