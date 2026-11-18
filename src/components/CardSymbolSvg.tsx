import type { TarotCard } from '../tarot/types';

interface CardSymbolSvgProps {
  card: TarotCard;
  className?: string;
}

function renderMajorGlyph(number: number, stroke: string, accent: string) {
  switch (number) {
    case 0: // Шут — солнце, обрыв, белая роза
      return (
        <>
          <circle cx="56" cy="20" r="7" stroke={accent} strokeWidth="1.4" />
          <path d="M56 9 V11 M56 29 V31 M45 20 H47 M65 20 H67 M49 13 L51 15 M61 25 L63 27" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12 62 H44 L54 70" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="36" r="10" stroke={stroke} strokeWidth="1.4" />
          <path d="M32 26 C35 32, 35 40, 32 46 M22 36 C28 33, 36 33, 42 36" stroke={accent} strokeWidth="1.1" />
        </>
      );
    case 1: // Маг — лемниската и четыре стихии
      return (
        <>
          <path d="M26 24 C26 18, 35 18, 40 24 C45 30, 54 30, 54 24 C54 18, 45 18, 40 24 C35 30, 26 30, 26 24 Z" stroke={accent} strokeWidth="1.6" />
          <path d="M40 34 V64 M20 48 H60" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="24" cy="40" r="3.5" stroke={stroke} strokeWidth="1.3" />
          <polygon points="56,37 60,44 52,44" stroke={accent} strokeWidth="1.3" />
          <rect x="21" y="54" width="6" height="6" stroke={accent} strokeWidth="1.3" />
          <path d="M53 54 L59 60 M59 54 L53 60" stroke={stroke} strokeWidth="1.3" />
        </>
      );
    case 2: // Верховная Жрица — колонны и полумесяц
      return (
        <>
          <path d="M22 16 V64 M58 16 V64" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 16 H26 M18 64 H26 M54 16 H62 M54 64 H62" stroke={accent} strokeWidth="1.4" />
          <circle cx="40" cy="34" r="10" stroke={stroke} strokeWidth="1.5" />
          <path d="M31 54 C35 60, 45 60, 49 54 C44 57, 36 57, 31 54 Z" stroke={accent} strokeWidth="1.5" fill="none" />
        </>
      );
    case 3: // Императрица — венец звёзд и знак Венеры
      return (
        <>
          <circle cx="40" cy="36" r="12" stroke={stroke} strokeWidth="1.7" />
          <path d="M40 48 V66 M32 58 H48" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M23 22 L26 17 L29 22 M37 18 L40 12 L43 18 M51 22 L54 17 L57 22" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 4: // Император — трон, скипетр анкх и держава
      return (
        <>
          <rect x="20" y="20" width="40" height="42" stroke={stroke} strokeWidth="1.4" />
          <circle cx="40" cy="31" r="7" stroke={accent} strokeWidth="1.6" />
          <path d="M40 38 V57 M31 45 H49" stroke={accent} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M24 20 C24 14, 18 14, 18 20 M56 20 C56 14, 62 14, 62 20" stroke={stroke} strokeWidth="1.4" />
        </>
      );
    case 5: // Иерофант — скрещённые ключи
      return (
        <>
          <path d="M24 58 L56 22 M56 58 L24 22" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="58" r="5" stroke={accent} strokeWidth="1.5" />
          <circle cx="56" cy="58" r="5" stroke={accent} strokeWidth="1.5" />
          <path d="M40 14 V32 M34 20 H46" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case 6: // Влюблённые — солнце над двумя кругами союза
      return (
        <>
          <circle cx="40" cy="20" r="8" stroke={accent} strokeWidth="1.5" />
          <path d="M40 9 V12 M29 14 L32 17 M51 14 L48 17" stroke={accent} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="31" cy="48" r="12" stroke={stroke} strokeWidth="1.5" />
          <circle cx="49" cy="48" r="12" stroke={accent} strokeWidth="1.5" />
        </>
      );
    case 7: // Колесница — балдахин и колесо движения
      return (
        <>
          <path d="M18 24 L40 14 L62 24 V44 H18 Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="40" cy="50" r="14" stroke={accent} strokeWidth="1.6" />
          <path d="M40 36 V64 M26 50 H54 M30 40 L50 60 M50 40 L30 60" stroke={stroke} strokeWidth="1.1" />
        </>
      );
    case 8: // Сила — лемниската и солнечный лев
      return (
        <>
          <path d="M28 20 C28 15, 36 15, 40 20 C44 25, 52 25, 52 20 C52 15, 44 15, 40 20 C36 25, 28 25, 28 20 Z" stroke={accent} strokeWidth="1.5" />
          <circle cx="40" cy="46" r="15" stroke={stroke} strokeWidth="1.7" />
          <circle cx="40" cy="46" r="8" stroke={accent} strokeWidth="1.2" strokeDasharray="3 2" />
        </>
      );
    case 9: // Отшельник — фонарь со звездой
      return (
        <>
          <path d="M40 12 V20" stroke={stroke} strokeWidth="1.6" />
          <polygon points="30,22 50,22 54,54 26,54" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M24 54 H56 L52 64 H28 Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <polygon points="40,30 46,43 34,43" stroke={accent} strokeWidth="1.2" />
          <polygon points="40,47 46,34 34,34" stroke={accent} strokeWidth="1.2" />
        </>
      );
    case 10: // Колесо Фортуны — алхимическое колесо
      return (
        <>
          <circle cx="40" cy="40" r="24" stroke={stroke} strokeWidth="1.8" />
          <circle cx="40" cy="40" r="17" stroke={accent} strokeWidth="1.1" />
          <circle cx="40" cy="40" r="5" stroke={stroke} strokeWidth="1.5" />
          <path d="M40 16 V64 M16 40 H64 M23 23 L57 57 M57 23 L23 57" stroke={accent} strokeWidth="1.2" />
        </>
      );
    case 11: // Справедливость — меч и весы
      return (
        <>
          <path d="M40 12 V66" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" />
          <path d="M20 28 H60" stroke={accent} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M20 28 L14 44 H26 Z M60 28 L54 44 H66 Z" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M32 56 H48" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case 12: // Повешенный — перевёрнутый треугольник с нимбом
      return (
        <>
          <path d="M18 18 H62 M40 18 V30" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <polygon points="26,30 54,30 40,54" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="40" cy="58" r="8" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="40" cy="58" r="3.5" stroke={accent} strokeWidth="1.3" />
        </>
      );
    case 13: // Смерть — мистическая роза и рассвет
      return (
        <>
          <circle cx="40" cy="36" r="16" stroke={stroke} strokeWidth="1.5" />
          <circle cx="40" cy="36" r="9" stroke={accent} strokeWidth="1.3" />
          <path d="M40 20 V52 M24 36 H56 M29 25 L51 47 M51 25 L29 47" stroke={accent} strokeWidth="1.1" />
          <path d="M18 62 H62" stroke={stroke} strokeWidth="1.5" />
        </>
      );
    case 14: // Умеренность — две чаши и поток
      return (
        <>
          <path d="M18 22 H34 L31 35 H21 Z" stroke={stroke} strokeWidth="1.5" />
          <path d="M46 47 H62 L59 60 H49 Z" stroke={stroke} strokeWidth="1.5" />
          <path d="M31 32 C42 32, 38 48, 50 48" stroke={accent} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M30 37 C40 37, 39 52, 48 52" stroke={accent} strokeWidth="1.1" strokeDasharray="2 2" />
        </>
      );
    case 15: // Дьявол — пентаграмма и цепь
      return (
        <>
          <circle cx="40" cy="38" r="22" stroke={stroke} strokeWidth="1.5" />
          <polygon
            points="40,58 28,22 57,44 23,44 52,22"
            stroke={accent}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </>
      );
    case 16: // Башня — башня, корона и молния
      return (
        <>
          <path d="M29 66 L32 30 H48 L51 66 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M28 24 L34 18 L40 24 L46 18 L52 24" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M58 10 L44 24 L50 26 L36 40" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 17: // Звезда — большая восьмиконечная звезда
      return (
        <>
          <path d="M40 12 V62 M15 37 H65 M22 19 L58 55 M58 19 L22 55" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="40" cy="37" r="6" fill="#15111C" stroke={stroke} strokeWidth="1.6" />
          <path d="M18 66 Q29 62 40 66 T62 66" stroke={stroke} strokeWidth="1.3" fill="none" />
        </>
      );
    case 18: // Луна — серп луны и две башни у воды
      return (
        <>
          <path d="M46 16 C34 16, 26 26, 26 36 C26 46, 34 54, 46 54 C38 50, 35 43, 35 36 C35 28, 38 20, 46 16 Z" stroke={accent} strokeWidth="1.7" />
          <rect x="16" y="44" width="10" height="20" stroke={stroke} strokeWidth="1.4" />
          <rect x="54" y="44" width="10" height="20" stroke={stroke} strokeWidth="1.4" />
          <path d="M14 66 H66" stroke={stroke} strokeWidth="1.4" />
        </>
      );
    case 19: // Солнце — сияющий солнечный диск
      return (
        <>
          <circle cx="40" cy="40" r="14" stroke={accent} strokeWidth="1.8" />
          <circle cx="40" cy="40" r="6" stroke={stroke} strokeWidth="1.2" />
          <path
            d="M40 12 V21 M40 59 V68 M12 40 H21 M59 40 H68 M20 20 L27 27 M53 53 L60 60 M60 20 L53 27 M27 53 L20 60"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case 20: // Суд — труба пробуждения и флаг с крестом
      return (
        <>
          <path d="M40 12 L40 50" stroke={stroke} strokeWidth="1.7" />
          <path d="M32 50 L40 36 L48 50 Z" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="24" y="54" width="32" height="12" stroke={stroke} strokeWidth="1.4" />
          <path d="M40 54 V66 M24 60 H56" stroke={accent} strokeWidth="1.3" />
        </>
      );
    default: // XXI Мир — лавровый венок и четыре знака
      return (
        <>
          <ellipse cx="40" cy="40" rx="18" ry="25" stroke={accent} strokeWidth="1.7" />
          <ellipse cx="40" cy="40" rx="14" ry="21" stroke={stroke} strokeWidth="0.9" strokeDasharray="3 2" />
          <circle cx="16" cy="18" r="3" stroke={stroke} strokeWidth="1.3" />
          <circle cx="64" cy="18" r="3" stroke={stroke} strokeWidth="1.3" />
          <circle cx="16" cy="62" r="3" stroke={stroke} strokeWidth="1.3" />
          <circle cx="64" cy="62" r="3" stroke={stroke} strokeWidth="1.3" />
        </>
      );
  }
}

export function CardSymbolSvg({ card, className = 'w-16 h-16' }: CardSymbolSvgProps) {
  const strokeColor =
    card.suit === 'major'
      ? '#E5D3B3'
      : card.suit === 'wands' || card.suit === 'pentacles'
        ? '#D4B475'
        : '#D1C4DD';
  const accentColor = card.suit === 'swords' || card.suit === 'cups' ? '#C97A8B' : '#C9A86A';

  const isCourt = card.arcana === 'minor' && card.number >= 11;
  const isAce = card.arcana === 'minor' && card.number === 1;

  if (card.suit === 'major') {
    return (
      <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
        {renderMajorGlyph(card.number, strokeColor, accentColor)}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      {/* Subtle Ace halo or Court crown */}
      {isAce && (
        <circle cx="40" cy="40" r="32" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.65" />
      )}
      {isCourt && (
        <path
          d="M28 14 L34 9 L40 14 L46 9 L52 14"
          stroke={accentColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {card.suit === 'wands' && (
        <>
          <path d="M40 18 L40 68" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M40 26 C47 22, 51 27, 45 31" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M40 40 C33 36, 29 41, 35 45" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M40 54 C47 50, 51 55, 45 59" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}

      {card.suit === 'cups' && (
        <>
          <path
            d="M24 24 H56 L51 41 C49 48 44 51 40 51 C36 51 31 48 29 41 Z"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M40 51 V64 M29 64 H51" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M31 30 C36 33, 44 27, 49 30" stroke={accentColor} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}

      {card.suit === 'swords' && (
        <>
          <path d="M40 16 L44 24 L43 53 H37 L36 24 Z" stroke={strokeColor} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M40 18 V53" stroke={accentColor} strokeWidth="0.9" opacity="0.7" />
          <path d="M26 53 H54" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <path d="M40 53 V66" stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="68" r="2.5" stroke={accentColor} strokeWidth="1.4" />
        </>
      )}

      {card.suit === 'pentacles' && (
        <>
          <circle cx="40" cy="43" r="24" stroke={strokeColor} strokeWidth="1.8" />
          <polygon
            points="40,22 45,36 60,36 48,45 52,59 40,51 28,59 32,45 20,36 35,36"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
