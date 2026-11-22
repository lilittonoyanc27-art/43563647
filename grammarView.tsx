import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Play,
  Bookmark,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChapterId, FavoriteItem, GrammarExercise, GrammarItem } from './types';
import { ClickableSpanish, shuffleArray } from './uiHelpers';

interface GrammarViewProps {
  chapterId: ChapterId;
  items: GrammarItem[];
  completedGrammarIds: string[];
  favorites: FavoriteItem[];
  onCompleteGrammar: (chapterId: ChapterId, grammarId: string) => void;
  onToggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
  onJumpToVideo: (chapterId: ChapterId, seconds: number) => void;
}

const GrammarExerciseCard: React.FC<{
  exercise: GrammarExercise;
  onSolved: (correct: boolean) => void;
}> = ({ exercise, onSolved }) => {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>(() =>
    shuffleArray(exercise.options)
  );
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    onSolved(opt === exercise.correctAnswer);
  };

  const handleRetry = () => {
    setSelected(null);
    setShuffledOptions(shuffleArray(exercise.options));
  };

  const isCorrect = selected === exercise.correctAnswer;

  return (
    <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-4 space-y-3">
      <ClickableSpanish
        es={exercise.promptEs}
        hy={exercise.promptHy}
        className="text-sm sm:text-base font-semibold text-[#2B1419]"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {shuffledOptions.map((opt) => {
          let style = 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020]';
          if (selected !== null) {
            if (opt === exercise.correctAnswer) {
              style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
            } else if (opt === selected) {
              style = 'bg-red-50 border-[#E53935] text-[#A51C30]';
            } else {
              style = 'bg-white/60 border-[#EBD9C4] text-[#6E4A52] opacity-70';
            }
          }
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={`text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors cursor-pointer disabled:cursor-default ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div
          className={`rounded-lg px-3.5 py-2.5 text-xs sm:text-sm flex items-start justify-between gap-3 animate-pop-success ${
            isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-[#A51C30]'
          }`}
        >
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {isCorrect ? '¡Exacto!' : `Correcto: ${exercise.correctAnswer}`}
              </p>
              <p className="font-armenian text-[#2B1419] mt-0.5">{exercise.explanationHy}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/70 text-[#6E4A52] cursor-pointer"
            title="Reintentar ejercicio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const GrammarView: React.FC<GrammarViewProps> = ({
  chapterId,
  items,
  completedGrammarIds,
  favorites,
  onCompleteGrammar,
  onToggleFavorite,
  onJumpToVideo,
}) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (items[0]) init[items[0].id] = true;
    return init;
  });
  const [solvedTracker, setSolvedTracker] = useState<Record<string, Set<string>>>({});

  const completedSet = useMemo(() => new Set(completedGrammarIds), [completedGrammarIds]);
  const favSet = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const toggleCard = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExerciseSolved = (grammarItem: GrammarItem, exId: string, correct: boolean) => {
    if (!correct) return;
    setSolvedTracker((prev) => {
      const nextSet = new Set(prev[grammarItem.id] ?? []);
      nextSet.add(exId);
      if (nextSet.size >= grammarItem.exercises.length) {
        onCompleteGrammar(chapterId, grammarItem.id);
      }
      return { ...prev, [grammarItem.id]: nextSet };
    });
  };

  const doneCount = items.filter((g) => completedSet.has(g.id)).length;

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-[#800020]" />
              Gramática en contexto — Capítulo {chapterId}
            </h2>
            <p className="text-sm text-[#6E4A52] mt-1">
              {items.length} estructuras clave explicadas con claridad en español y armenio oriental + práctica interactiva inmediata.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E4A52] block">
              Temas completados
            </span>
            <span className="font-display text-2xl font-bold text-[#800020] tabular-nums">
              {doneCount} / {items.length}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isOpen = Boolean(openIds[item.id]);
          const isCompleted = completedSet.has(item.id);
          const isFav = favSet.has(item.id);

          return (
            <article
              key={item.id}
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition-colors ${
                isCompleted ? 'border-emerald-300' : 'border-[#EBD9C4]'
              }`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleCard(item.id)}
                className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#FFF8E7]/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
                    <span>Estructura {idx + 1}</span>
                    {isCompleted && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completado
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#2B1419]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6E4A52]">{item.ruleEs}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite({
                        id: item.id,
                        chapterId,
                        category: 'grammar',
                        es: item.title,
                        hy: item.explanationHy,
                        extra: item.exampleEs,
                        timestamp: item.timestamp,
                        timeLabel: item.timeLabel,
                      });
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isFav
                        ? 'text-[#800020] bg-[#FFD54F]/35'
                        : 'text-[#6E4A52] hover:bg-[#FFF8E7]'
                    }`}
                    title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Bookmark className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                  <span className="p-2 rounded-lg text-[#800020] bg-[#FFF8E7]">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </div>
              </div>

              {/* Expanded Educational Content */}
              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 space-y-5 border-t border-[#EBD9C4]/70 pt-5">
                  {/* Detailed Eastern Armenian Explanation */}
                  <div className="rounded-xl bg-[#FFF8E7] border border-[#FFD54F]/60 p-4 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#800020]">
                      Explicación detallada en armenio oriental
                    </span>
                    <p className="text-sm sm:text-base text-[#2B1419] font-armenian leading-relaxed">
                      {item.explanationHy}
                    </p>
                  </div>

                  {/* Episode Example */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#800020]">
                        Ejemplo del episodio
                      </span>
                      <button
                        type="button"
                        onClick={() => onJumpToVideo(chapterId, item.timestamp)}
                        className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#800020] hover:underline cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Ver escena ({item.timeLabel})
                      </button>
                    </div>
                    <div className="rounded-xl border border-[#EBD9C4] p-4 bg-white">
                      <ClickableSpanish
                        es={`«${item.exampleEs}»`}
                        hy={item.exampleHy}
                        withAudio
                        className="text-base sm:text-lg font-semibold text-[#2B1419]"
                      />
                    </div>
                  </div>

                  {/* Additional Everyday Examples */}
                  {item.extraExamples.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
                        Más ejemplos cotidianos (haz clic para ver el armenio)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.extraExamples.map((ex, i) => (
                          <div key={i} className="rounded-xl border border-[#EBD9C4]/80 p-3.5 bg-[#FFF8E7]/30">
                            <ClickableSpanish
                              es={ex.es}
                              hy={ex.hy}
                              withAudio
                              className="text-sm font-medium text-[#2B1419]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Practice */}
                  <div className="space-y-3 pt-2 border-t border-[#EBD9C4]/70">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#800020]">
                        Práctica interactiva ({item.exercises.length} ejercicios)
                      </span>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => onCompleteGrammar(chapterId, item.id)}
                          className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Marcar tema como estudiado
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {item.exercises.map((ex) => (
                        <GrammarExerciseCard
                          key={ex.id}
                          exercise={ex}
                          onSolved={(ok) => handleExerciseSolved(item, ex.id, ok)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
