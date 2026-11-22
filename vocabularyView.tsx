import React, { useMemo, useState } from 'react';
import {
  Search,
  Volume2,
  Bookmark,
  CheckCircle2,
  Play,
  AlertTriangle,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { ChapterId, FavoriteItem, VocabItem } from './types';
import { ClickableSpanish, speakSpanish } from './uiHelpers';

type VocabFilter = 'all' | 'argentinisms' | 'colloquial' | 'learning' | 'known' | 'favorites';

interface VocabularyViewProps {
  chapterId: ChapterId;
  items: VocabItem[];
  knownVocabIds: string[];
  favorites: FavoriteItem[];
  onToggleKnown: (chapterId: ChapterId, vocabId: string) => void;
  onToggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
  onJumpToVideo: (chapterId: ChapterId, seconds: number) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  chapterId,
  items,
  knownVocabIds,
  favorites,
  onToggleKnown,
  onToggleFavorite,
  onJumpToVideo,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VocabFilter>('all');
  const [showAllArmenian, setShowAllArmenian] = useState(false);

  const knownSet = useMemo(() => new Set(knownVocabIds), [knownVocabIds]);
  const favSet = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'argentinisms' && !item.isArgentinism) return false;
      if (filter === 'colloquial' && item.register === 'neutro') return false;
      if (filter === 'learning' && knownSet.has(item.id)) return false;
      if (filter === 'known' && !knownSet.has(item.id)) return false;
      if (filter === 'favorites' && !favSet.has(item.id)) return false;

      if (!q) return true;
      return (
        item.spanish.toLowerCase().includes(q) ||
        item.hy.toLowerCase().includes(q) ||
        item.explanationEs.toLowerCase().includes(q) ||
        item.episodeExample.toLowerCase().includes(q)
      );
    });
  }, [items, search, filter, knownSet, favSet]);

  const knownCount = items.filter((i) => knownSet.has(i.id)).length;
  const pct = items.length ? Math.round((knownCount / items.length) * 100) : 0;

  const filterOptions: { id: VocabFilter; label: string }[] = [
    { id: 'all', label: `Todos (${items.length})` },
    { id: 'argentinisms', label: 'Argentinismos' },
    { id: 'colloquial', label: 'Coloquial / Cuidado' },
    { id: 'learning', label: 'Por aprender' },
    { id: 'known', label: `Ya lo sé (${knownCount})` },
    { id: 'favorites', label: 'Favoritos' },
  ];

  return (
    <section className="space-y-6">
      {/* Header & Progress Bar */}
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-[#800020]" />
              Vocabulario esencial — Capítulo {chapterId}
            </h2>
            <p className="text-sm text-[#6E4A52] mt-1">
              {items.length} palabras y expresiones clave del episodio · Haz clic en cualquier palabra o ejemplo en español para abrir su traducción al armenio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllArmenian((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#FFF8E7] border border-[#EBD9C4] text-[#800020] hover:border-[#800020] transition-colors cursor-pointer whitespace-nowrap"
          >
            {showAllArmenian ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllArmenian ? 'Ocultar todas las traducciones' : 'Mostrar todas las traducciones'}
          </button>
        </div>

        {/* Mastery bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52]">
            <span>Dominio del vocabulario del capítulo</span>
            <span className="text-[#800020] tabular-nums">
              {knownCount} / {items.length} ({pct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#FFF8E7] border border-[#EBD9C4] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#800020] via-[#E53935] to-[#FF9800] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E4A52] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar palabra en español o traducción en armenio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8E7]/50 border border-[#EBD9C4] text-sm text-[#2B1419] placeholder:text-[#6E4A52]/70 focus:outline-none focus:border-[#800020]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  filter === opt.id
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBD9C4] p-10 text-center text-[#6E4A52]">
          <p className="font-medium">No hay palabras que coincidan con este filtro.</p>
          <p className="text-sm font-armenian mt-1">Այս ֆիլտրով բառեր չկան։</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isKnown = knownSet.has(item.id);
            const isFav = favSet.has(item.id);
            const isExpression = item.spanish.trim().includes(' ');

            return (
              <article
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs transition-colors flex flex-col justify-between gap-4 ${
                  isKnown ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#EBD9C4]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top metadata line (clean inline text, zero static pills) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6E4A52]">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold uppercase tracking-wide">
                      <span className="text-[#800020]">
                        {item.isArgentinism ? 'Español argentino' : 'Español general'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.register === 'informal / cuidado'
                            ? 'text-[#E53935]'
                            : item.register === 'muy coloquial'
                              ? 'text-[#A51C30]'
                              : 'text-[#6E4A52]'
                        }
                      >
                        {item.register}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToVideo(chapterId, item.timestamp)}
                      className="inline-flex items-center gap-1 font-mono text-xs text-[#800020] hover:underline cursor-pointer tabular-nums"
                      title="Ver escena en el vídeo"
                    >
                      <Play className="w-3 h-3" />
                      {item.timeLabel}
                    </button>
                  </div>

                  {/* Clickable Spanish Headword */}
                  <ClickableSpanish
                    es={item.spanish}
                    hy={item.hy}
                    forceOpen={showAllArmenian ? true : undefined}
                    withAudio
                    className="font-display text-xl sm:text-2xl font-bold text-[#2B1419]"
                  />

                  {/* Explanations */}
                  <div className="space-y-1 text-sm">
                    <p className="text-[#2B1419] leading-relaxed">{item.explanationEs}</p>
                    <p className="text-[#6E4A52] font-armenian leading-relaxed">
                      {item.explanationHy}
                    </p>
                  </div>

                  {/* Register warning if colloquial/caution */}
                  {item.registerNoteHy && (
                    <div className="rounded-xl bg-[#FF9800]/10 border border-[#FF9800]/35 px-3 py-2 flex items-start gap-2 text-xs text-[#2B1419]">
                      <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                      <span className="font-armenian leading-relaxed">{item.registerNoteHy}</span>
                    </div>
                  )}

                  {/* Examples */}
                  <div className="space-y-2.5 pt-2 border-t border-[#EBD9C4]/70">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#800020] mb-1">
                        Ejemplo del episodio
                      </span>
                      <ClickableSpanish
                        es={`«${item.episodeExample}»`}
                        hy={item.episodeExampleHy}
                        forceOpen={showAllArmenian ? true : undefined}
                        className="text-sm font-medium text-[#2B1419] italic"
                        hyClassName="text-xs sm:text-sm text-[#800020] font-armenian mt-1 bg-[#FFF8E7] border border-[#FFD54F]/50 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6E4A52] mb-1">
                        Ejemplo en la vida diaria
                      </span>
                      <ClickableSpanish
                        es={item.dailyExample}
                        hy={item.dailyExampleHy}
                        forceOpen={showAllArmenian ? true : undefined}
                        className="text-sm text-[#2B1419]"
                        hyClassName="text-xs sm:text-sm text-[#800020] font-armenian mt-1 bg-[#FFF8E7] border border-[#FFD54F]/50 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EBD9C4]/70">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakSpanish(item.spanish)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFF8E7] text-[#800020] hover:bg-[#FFD54F]/30 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Escuchar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleFavorite({
                          id: item.id,
                          chapterId,
                          category: isExpression ? 'expression' : 'word',
                          es: item.spanish,
                          hy: item.hy,
                          extra: item.explanationHy,
                          timestamp: item.timestamp,
                          timeLabel: item.timeLabel,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isFav
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-white text-[#800020] border-[#EBD9C4] hover:border-[#800020]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                      {isFav ? 'Guardado' : 'Favorito'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleKnown(chapterId, item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isKnown
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-emerald-700 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isKnown ? 'Ya lo sé ✓' : 'Ya lo sé'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
