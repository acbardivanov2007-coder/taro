import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { SUIT_LABELS_RU, TAROT_DECK } from '../tarot/deck';
import type { TarotCard, TarotSuit } from '../tarot/types';
import { TarotCardPlate } from './TarotCardPlate';

type FilterSuit = 'all' | TarotSuit;

interface DeckExplorerProps {
  onInspectCard: (card: TarotCard) => void;
}

const SUIT_TABS: Array<{ key: FilterSuit; label: string; count: number }> = [
  { key: 'all', label: 'Все карты', count: 78 },
  { key: 'major', label: 'Старшие Арканы', count: 22 },
  { key: 'wands', label: 'Жезлы', count: 14 },
  { key: 'cups', label: 'Кубки', count: 14 },
  { key: 'swords', label: 'Мечи', count: 14 },
  { key: 'pentacles', label: 'Пентакли', count: 14 },
];

export function DeckExplorer({ onInspectCard }: DeckExplorerProps) {
  const [suitFilter, setSuitFilter] = useState<FilterSuit>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TAROT_DECK.filter((card) => {
      if (suitFilter !== 'all' && card.suit !== suitFilter) return false;
      if (!q) return true;
      return (
        card.nameRu.toLowerCase().includes(q) ||
        card.nameEn.toLowerCase().includes(q) ||
        card.archetype.toLowerCase().includes(q) ||
        SUIT_LABELS_RU[card.suit].toLowerCase().includes(q)
      );
    });
  }, [suitFilter, query]);

  return (
    <section aria-label="Справочник колоды Райдера — Уэйта" className="py-8">
      <div className="flex flex-col gap-6 border-b border-[#2D2337] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#C9A86A]">Архив системы Райдера — Уэйта</p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#EFE8DC]">
            Полная колода из 78 карт
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A99FB2]">
            Нажмите на любую карту, чтобы изучить её традиционную символику, стихию, а также классические
            значения в прямом и перевёрнутом положениях.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label htmlFor="deck-search" className="sr-only">
            Поиск карты по названию или архетипу
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8FA6]"
              aria-hidden="true"
            />
            <input
              id="deck-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск карты..."
              className="w-full rounded-md border border-[#3B2E46] bg-[#14101B] py-2 pl-9 pr-3 text-sm text-[#EFE8DC] placeholder:text-[#7E738A] focus:border-[#C9A86A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter buttons (interactive controls) */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Фильтр по мастям">
        {SUIT_TABS.map((tab) => {
          const active = suitFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSuitFilter(tab.key)}
              className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-[#6B1D2F] text-[#FAF4EA] border border-[#8F3448]'
                  : 'bg-[#17121F] text-[#BFB5CA] border border-[#2D2337] hover:border-[#C9A86A]/45 hover:text-[#EFE8DC]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-md border border-[#2D2337] bg-[#14101B] p-8 text-center">
          <p className="font-serif text-xl text-[#EFE8DC]">Карты по вашему запросу не найдены</p>
          <p className="mt-1 text-sm text-[#A99FB2]">Попробуйте изменить поисковую фразу или сбросить фильтр масти.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuitFilter('all');
            }}
            className="mt-4 rounded-md border border-[#3B2E46] px-4 py-2 text-xs font-medium text-[#EFE8DC] hover:bg-[#1F1829] cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((card) => (
            <TarotCardPlate
              key={card.id}
              card={card}
              orientation="upright"
              compact
              onSelect={(selected) => onInspectCard(selected)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
