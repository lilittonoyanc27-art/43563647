import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Volume2,
  Play,
  Trash2,
  Sparkles,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { ChapterId, FavoriteCategory, FavoriteItem } from './types';
import { ClickableSpanish, shuffleArray, speakSpanish } from './uiHelpers';

interface FavoritesViewProps {
  favorites: FavoriteItem[];
  onRemoveFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
  onJumpToVideo: (chapterId: ChapterId, seconds: number) => void;
}

const CATEGORY_LABELS: Record<FavoriteCategory, string> = {
  word: 'Palabra',
  expression: 'Expresión',
  line: 'Réplica',
  grammar: 'Gramática',
  video: 'Momento de vídeo',
};

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onRemoveFavorite,
  onJumpToVideo,
}) => {
  const [catFilter, setCatFilter] = useState<'all' | FavoriteCategory>('all');
  const [chapFilter, setChapFilter] = useState<'all' | ChapterId>('all');

  // Flashcard review mode state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewDeck, setReviewDeck] = useState<FavoriteItem[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [revealHy, setRevealHy] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const filtered = useMemo(() => {
    return favorites.filter((f) => {
      if (catFilter !== 'all' && f.category !== catFilter) return false;
      if (chapFilter !== 'all' && f.chapterId !== chapFilter) return false;
      return true;
    });
  }, [favorites, catFilter, chapFilter]);

  const startReview = () => {
    const source = filtered.length > 0 ? filtered : favorites;
    if (source.length === 0) return;
    setReviewDeck(shuffleArray(source));
    setReviewIdx(0);
    setRevealHy(false);
    setReviewedCount(0);
    setReviewMode(true);
  };

  if (reviewMode) {
    const card = reviewDeck[reviewIdx];
    const finished = !card || reviewIdx >= reviewDeck.length;

    return (
      <section className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#800020] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF9800]" />
              Repasar mis favoritos
            </h2>
            <p className="text-sm text-[#6E4A52]">
              Tarjetas interactivas solo con tus palabras, réplicas y temas guardados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReviewMode(false)}
            className="px-4 py-2 rounded-xl border border-[#EBD9C4] text-sm font-semibold text-[#2B1419] hover:bg-[#FFF8E7] cursor-pointer"
          >
            Volver a la lista
          </button>
        </div>

        {finished ? (
          <div className="bg-white rounded-2xl border border-[#FFD54F] p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="font-display text-2xl font-bold text-[#800020]">
              ¡Repaso completado!
            </h3>
            <p className="text-sm text-[#2B1419]">
              Has repasado <strong>{reviewedCount}</strong> elementos de tus favoritos.
            </p>
            <p className="text-sm font-armenian text-[#6E4A52]">
              Հիանալի կրկնություն։ Պահպանված բառերը կմնան քո հիշողության մեջ։
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={startReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Repasar otra vez
              </button>
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="px-5 py-2.5 rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] text-sm font-semibold text-[#2B1419] cursor-pointer"
              >
                Ver todos mis favoritos
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EBD9C4] p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
              <span>
                Capítulo {card.chapterId} · {CATEGORY_LABELS[card.category]}
              </span>
              <span>
                Tarjeta {reviewIdx + 1} / {reviewDeck.length}
              </span>
            </div>

            <div className="rounded-2xl bg-[#FFF8E7] border border-[#EBD9C4] p-6 text-center space-y-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] leading-snug">
                {card.es}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => speakSpanish(card.es)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EBD9C4] text-xs font-semibold text-[#800020] cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar
                </button>
                {card.timestamp !== undefined && (
                  <button
                    type="button"
                    onClick={() => onJumpToVideo(card.chapterId, card.timestamp!)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EBD9C4] text-xs font-mono text-[#800020] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {card.timeLabel || 'Ver escena'}
                  </button>
                )}
              </div>

              {revealHy ? (
                <div className="pt-4 border-t border-[#EBD9C4] animate-pop-success space-y-1.5">
                  <p className="text-lg sm:text-xl font-armenian font-semibold text-[#800020]">
                    {card.hy}
                  </p>
                  {card.extra && (
                    <p className="text-xs sm:text-sm text-[#6E4A52] font-armenian">{card.extra}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealHy(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#800020] text-white text-sm font-semibold hover:bg-[#A51C30] cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Mostrar traducción en armenio
                </button>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setReviewedCount((c) => c + 1);
                  setReviewIdx((i) => i + 1);
                  setRevealHy(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9800] text-[#2B1419] font-bold text-sm hover:bg-[#FFD54F] cursor-pointer"
              >
                {reviewIdx + 1 >= reviewDeck.length ? 'Terminar repaso' : 'Siguiente tarjeta'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] flex items-center gap-2.5">
              <Bookmark className="w-6 h-6 text-[#800020]" />
              Mis favoritos ({favorites.length})
            </h1>
            <p className="text-sm text-[#6E4A52] mt-1">
              Guarda palabras, expresiones, réplicas, temas gramaticales y momentos clave de los capítulos 18, 19 y 20 para repasarlos cuando quieras.
            </p>
          </div>
          <button
            type="button"
            disabled={favorites.length === 0}
            onClick={startReview}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#FFD54F]" />
            Repasar mis favoritos
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBD9C4]/70">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', 'Todos'],
                ['word', 'Palabras'],
                ['expression', 'Expresiones'],
                ['line', 'Réplicas'],
                ['grammar', 'Gramática'],
                ['video', 'Momentos de vídeo'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setCatFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  catFilter === val
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 18, 19, 20] as const).map((c) => (
              <button
                key={String(c)}
                type="button"
                onClick={() => setChapFilter(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  chapFilter === c
                    ? 'bg-[#2B1419] text-[#FFD54F] border-[#2B1419]'
                    : 'bg-[#FFF8E7] text-[#2B1419] border-[#EBD9C4]'
                }`}
              >
                {c === 'all' ? 'Todos los capítulos' : `Cap. ${c}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBD9C4] p-10 text-center space-y-2">
          <Bookmark className="w-10 h-10 text-[#EBD9C4] mx-auto" />
          <p className="font-semibold text-[#2B1419]">
            {favorites.length === 0
              ? 'Todavía no has guardado ningún favorito.'
              : 'No hay favoritos en esta categoría o capítulo.'}
          </p>
          <p className="text-sm font-armenian text-[#6E4A52]">
            Սեղմիր էջանիշի կոճակը ցանկացած բառի, տողի, քերականության կամ տեսանյութի պահի վրա՝ այն այստեղ պահելու համար։
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-[#EBD9C4] p-5 shadow-2xs flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52]">
                  <span className="uppercase tracking-wider text-[#800020]">
                    Capítulo {item.chapterId} · {CATEGORY_LABELS[item.category]}
                  </span>
                  {item.timeLabel && (
                    <span className="font-mono tabular-nums">{item.timeLabel}</span>
                  )}
                </div>

                <ClickableSpanish
                  es={item.es}
                  hy={item.hy}
                  defaultOpen
                  withAudio
                  className="text-base sm:text-lg font-bold text-[#2B1419]"
                />
                {item.extra && (
                  <p className="text-xs text-[#6E4A52] font-armenian leading-relaxed">
                    {item.extra}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#EBD9C4]/70">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakSpanish(item.es)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFF8E7] text-xs font-semibold text-[#800020] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Escuchar
                  </button>
                  {item.timestamp !== undefined && (
                    <button
                      type="button"
                      onClick={() => onJumpToVideo(item.chapterId, item.timestamp!)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFF8E7] text-xs font-semibold text-[#800020] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Ir al vídeo
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFavorite(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#E53935] hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
