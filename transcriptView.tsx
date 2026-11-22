import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Play,
  Repeat,
  Bookmark,
  Eye,
  EyeOff,
  FileText,
  Volume2,
  X,
} from 'lucide-react';
import { ChapterId, FavoriteItem, SubtitleLine } from './types';
import { speakSpanish } from './uiHelpers';

interface TranscriptViewProps {
  chapterId: ChapterId;
  subtitles: SubtitleLine[];
  currentTime: number;
  isPlaying: boolean;
  showAllTranslations: boolean;
  onToggleShowAllTranslations: (value: boolean) => void;
  onSeekToLine: (seconds: number, autoplay?: boolean) => void;
  favorites: FavoriteItem[];
  onToggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
  standalone?: boolean;
}

interface NumberedSubtitleLine {
  line: SubtitleLine;
  lineNumber: number;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  chapterId,
  subtitles,
  currentTime,
  isPlaying,
  showAllTranslations,
  onToggleShowAllTranslations,
  onSeekToLine,
  favorites,
  onToggleFavorite,
  standalone = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(!standalone);
  const [openLineIds, setOpenLineIds] = useState<Record<string, boolean>>({});
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset search and individual open states when switching chapter
  useEffect(() => {
    setSearchQuery('');
    setOpenLineIds({});
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [chapterId]);

  // Find active timestamp (supports multiple lines sharing identical timestamp)
  const activeStart = useMemo(() => {
    if (!subtitles.length) return -1;
    let start = -1;
    for (let i = 0; i < subtitles.length; i++) {
      if (subtitles[i].start <= currentTime + 0.35) {
        start = subtitles[i].start;
      } else {
        break;
      }
    }
    return start;
  }, [subtitles, currentTime]);

  const activeFirstId = useMemo(() => {
    if (activeStart === -1) return null;
    return subtitles.find((s) => s.start === activeStart)?.id ?? null;
  }, [subtitles, activeStart]);

  // Smooth auto-scroll inside transcript container when playing
  useEffect(() => {
    if (!autoScroll || !isPlaying || !activeFirstId || searchQuery.trim()) return;
    const row = rowRefs.current[activeFirstId];
    const container = listContainerRef.current;
    if (row && container) {
      const targetTop = row.offsetTop - container.clientHeight / 3;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  }, [activeFirstId, autoScroll, isPlaying, searchQuery]);

  const numberedLines = useMemo<NumberedSubtitleLine[]>(
    () => subtitles.map((line, idx) => ({ line, lineNumber: idx + 1 })),
    [subtitles]
  );

  const filteredLines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return numberedLines;
    return numberedLines.filter(
      ({ line, lineNumber }) =>
        line.text.toLowerCase().includes(q) ||
        line.hy.toLowerCase().includes(q) ||
        line.timeLabel.includes(q) ||
        `#${lineNumber}` === q
    );
  }, [numberedLines, searchQuery]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const toggleLine = (id: string) => {
    setOpenLineIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="bg-white rounded-2xl border border-[#EBD9C4] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#EBD9C4] bg-[#FFF8E7]/60 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#2B1419] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#800020]" />
              Transcripción completa — Capítulo {chapterId}
            </h2>
            <p className="text-sm text-[#6E4A52] mt-1">
              <strong className="text-[#2B1419] tabular-nums">{subtitles.length}</strong> réplicas originales completas con traducción al armenio oriental · Haz clic en cualquier frase en español para abrir su traducción o en el tiempo para ir al vídeo.
            </p>
            <p className="text-xs font-armenian text-[#800020] mt-0.5">
              Ամբողջական բնօրինակ տեքստ ({subtitles.length} տող)՝ արևելահայերեն թարգմանությամբ։ Սեղմիր իսպաներեն տողի վրա՝ թարգմանությունը բացելու համար։
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleShowAllTranslations(!showAllTranslations)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              showAllTranslations
                ? 'bg-[#800020] text-white border-[#800020] hover:bg-[#A51C30]'
                : 'bg-white text-[#800020] border-[#800020]/30 hover:bg-[#FFD54F]/25'
            }`}
          >
            {showAllTranslations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllTranslations ? 'Ocultar traducción completa' : 'Mostrar traducción completa'}
          </button>
        </div>

        {/* Search & View Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E4A52] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el texto español, en armenio o por minuto (ej. 12:30, Ivo, Milagros)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#EBD9C4] text-sm text-[#2B1419] placeholder:text-[#6E4A52]/70 focus:outline-none focus:border-[#800020]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6E4A52] hover:text-[#800020] cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchQuery.trim() && (
              <span className="text-xs font-semibold text-[#800020] px-2.5 py-2 rounded-xl bg-[#FFD54F]/25 tabular-nums whitespace-nowrap">
                {filteredLines.length} / {subtitles.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => setAutoScroll((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                autoScroll
                  ? 'bg-[#2B1419] text-[#FFD54F] border-[#2B1419]'
                  : 'bg-white text-[#6E4A52] border-[#EBD9C4]'
              }`}
            >
              Desplazamiento automático: {autoScroll ? 'Sí' : 'No'}
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Lines List */}
      <div
        ref={listContainerRef}
        className={`${standalone ? 'max-h-[72vh]' : 'max-h-[560px]'} overflow-y-auto divide-y divide-[#EBD9C4]/70`}
      >
        {filteredLines.length === 0 ? (
          <div className="p-8 text-center text-[#6E4A52]">
            <p className="text-sm font-medium">No se encontraron réplicas con «{searchQuery}».</p>
            <p className="text-xs font-armenian mt-1">Այս հարցումով տողեր չեն գտնվել։</p>
          </div>
        ) : (
          filteredLines.map(({ line, lineNumber }) => {
            const isActive = line.start === activeStart && activeStart !== -1;
            const isOpen = showAllTranslations || Boolean(openLineIds[line.id]);
            const isFav = favoriteIds.has(line.id);

            return (
              <div
                key={line.id}
                ref={(el) => {
                  rowRefs.current[line.id] = el;
                }}
                className={`p-3.5 sm:px-6 sm:py-4 transition-colors ${
                  isActive ? 'bg-[#FFD54F]/20' : 'hover:bg-[#FFF8E7]/70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4">
                  {/* Sequential number + clickable timestamp */}
                  <div className="flex items-center gap-2 shrink-0 sm:w-32">
                    <span className="text-[11px] font-mono text-[#6E4A52]/75 tabular-nums w-10">
                      #{lineNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSeekToLine(line.start, true)}
                      className={`font-mono text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer tabular-nums ${
                        isActive
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-[#FFF8E7] text-[#800020] border-[#EBD9C4] hover:border-[#800020]'
                      }`}
                      title="Ir a este momento del vídeo"
                    >
                      [{line.timeLabel}]
                    </button>
                  </div>

                  {/* Clickable Spanish text + Armenian translation underneath */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleLine(line.id)}
                      className="text-left w-full group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800020] rounded"
                    >
                      <p className="text-base sm:text-[17px] font-medium text-[#2B1419] group-hover:text-[#A51C30] leading-relaxed">
                        {line.text}
                      </p>
                    </button>

                    {isOpen && (
                      <div className="mt-2 bg-[#FFF8E7] border border-[#FFD54F]/60 rounded-lg px-3 py-2 animate-pop-success">
                        <p className="text-sm sm:text-base text-[#800020] font-armenian leading-relaxed">
                          {line.hy}
                        </p>
                        {line.note && (
                          <p className="mt-1 text-xs text-[#6E4A52] italic">
                            Nota: {line.note}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => speakSpanish(line.text)}
                      className="p-2 rounded-lg text-[#6E4A52] hover:text-[#800020] hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                      title="Escuchar pronunciación"
                      aria-label="Escuchar pronunciación"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSeekToLine(line.start, true)}
                      className="p-2 rounded-lg text-[#6E4A52] hover:text-[#800020] hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                      title="Ir a este momento del vídeo"
                      aria-label="Ir a este momento del vídeo"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSeekToLine(line.start, true)}
                      className="p-2 rounded-lg text-[#6E4A52] hover:text-[#800020] hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                      title="Repetir frase"
                      aria-label="Repetir frase"
                    >
                      <Repeat className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleFavorite({
                          id: line.id,
                          chapterId,
                          category: 'line',
                          es: line.text,
                          hy: line.hy,
                          timestamp: line.start,
                          timeLabel: line.timeLabel,
                        })
                      }
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isFav
                          ? 'text-[#800020] bg-[#FFD54F]/35'
                          : 'text-[#6E4A52] hover:text-[#800020] hover:bg-[#FFF8E7]'
                      }`}
                      title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <Bookmark className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
