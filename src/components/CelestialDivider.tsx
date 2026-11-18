interface CelestialDividerProps {
  variant?: 'lunar' | 'constellation';
  className?: string;
}

export function CelestialDivider({ variant = 'lunar', className = '' }: CelestialDividerProps) {
  return (
    <div className={`flex items-center gap-4 my-8 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C9A86A]/35 to-[#C9A86A]/45" />
      {variant === 'lunar' ? (
        <svg viewBox="0 0 96 20" className="h-4 w-20 text-[#C9A86A]" fill="none">
          <circle cx="14" cy="10" r="1.3" fill="currentColor" opacity="0.7" />
          <path
            d="M32 5 C28 5, 25 7.5, 25 10 C25 12.5, 28 15, 32 15 C29.5 13.8, 28.5 12, 28.5 10 C28.5 8, 29.5 6.2, 32 5 Z"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <path d="M48 3 L49.6 8.4 L55 10 L49.6 11.6 L48 17 L46.4 11.6 L41 10 L46.4 8.4 Z" stroke="currentColor" strokeWidth="1" />
          <path
            d="M64 5 C68 5, 71 7.5, 71 10 C71 12.5, 68 15, 64 15 C66.5 13.8, 67.5 12, 67.5 10 C67.5 8, 66.5 6.2, 64 5 Z"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <circle cx="82" cy="10" r="1.3" fill="currentColor" opacity="0.7" />
        </svg>
      ) : (
        <svg viewBox="0 0 96 20" className="h-4 w-20 text-[#C9A86A]" fill="none">
          <path
            d="M16 12 L32 6 L48 13 L64 5 L80 12"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          <circle cx="16" cy="12" r="1.6" fill="currentColor" />
          <circle cx="32" cy="6" r="1.4" fill="currentColor" />
          <circle cx="48" cy="13" r="2" fill="currentColor" />
          <circle cx="64" cy="5" r="1.4" fill="currentColor" />
          <circle cx="80" cy="12" r="1.6" fill="currentColor" />
        </svg>
      )}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C9A86A]/35 to-[#C9A86A]/45" />
    </div>
  );
}
