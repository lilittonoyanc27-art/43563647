import React, { useState } from 'react';
import {
  BarChart3,
  Play,
  RotateCcw,
  Star,
  Clock,
  Award,
  BookOpen,
  Gamepad2,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { AppProgressState, ChapterBundle, ChapterId } from './types';
import { ConfirmModal, formatStudyTime, formatTime } from './uiHelpers';
import { GAMES_CATALOG } from './gamesView';

interface ProgressViewProps {
  progress: AppProgressState;
  chapters: Record<ChapterId, ChapterBundle>;
  onContinueChapter: (chapterId: ChapterId, videoTime: number) => void;
  onResetChapter: (chapterId: ChapterId) => void;
  onResetGame: (chapterId: ChapterId, gameId: string) => void;
  onResetAll: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  chapters,
  onContinueChapter,
  onResetChapter,
  onResetGame,
  onResetAll,
}) => {
  const [confirmTarget, setConfirmTarget] = useState<'all' | ChapterId | null>(null);

  const chapterIds: ChapterId[] = [18, 19, 20];

  const totalPoints = chapterIds.reduce((sum, id) => sum + progress.chapters[id].points, 0);
  const totalStudySec = chapterIds.reduce((sum, id) => sum + progress.chapters[id].studySeconds, 0);
  const totalKnownVocab = chapterIds.reduce(
    (sum, id) => sum + progress.chapters[id].knownVocabIds.length,
    0
  );
  const totalGamesDone = chapterIds.reduce(
    (sum, id) =>
      sum + Object.values(progress.chapters[id].gameRecords).filter((r) => r.completed).length,
    0
  );

  return (
    <section className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-[#800020]" />
              Mi progreso de aprendizaje
            </h1>
            <p className="text-sm text-[#6E4A52] mt-1">
              Todo tu progreso se guarda automáticamente en este dispositivo por capítulo independiente.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmTarget('all')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E53935]/40 text-xs sm:text-sm font-semibold text-[#E53935] hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Reiniciar todo el progreso
          </button>
        </div>

        {/* Global KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A52]">
              <Award className="w-4 h-4 text-[#FF9800]" />
              Puntos totales
            </div>
            <p className="font-display text-2xl font-bold text-[#800020] mt-1 tabular-nums">
              {totalPoints}
            </p>
          </div>

          <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A52]">
              <Gamepad2 className="w-4 h-4 text-[#800020]" />
              Juegos completados
            </div>
            <p className="font-display text-2xl font-bold text-[#2B1419] mt-1 tabular-nums">
              {totalGamesDone} / 54
            </p>
          </div>

          <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A52]">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              Palabras dominadas
            </div>
            <p className="font-display text-2xl font-bold text-[#2B1419] mt-1 tabular-nums">
              {totalKnownVocab} / 150
            </p>
          </div>

          <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A52]">
              <Bookmark className="w-4 h-4 text-[#A51C30]" />
              Favoritos guardados
            </div>
            <p className="font-display text-2xl font-bold text-[#2B1419] mt-1 tabular-nums">
              {progress.favorites.length}
            </p>
          </div>

          <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E4A52]">
              <Clock className="w-4 h-4 text-[#800020]" />
              Tiempo de estudio
            </div>
            <p className="font-display text-2xl font-bold text-[#2B1419] mt-1 tabular-nums">
              {formatStudyTime(totalStudySec)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-Chapter Independent Progress Cards */}
      <div className="space-y-5">
        {chapterIds.map((chapId) => {
          const cp = progress.chapters[chapId];
          const bundle = chapters[chapId];
          const watchedPct = Math.min(
            100,
            Math.round((cp.maxVideoTime / Math.max(cp.videoDuration || bundle.durationApproxSec, 1)) * 100)
          );
          const gamesDone = Object.values(cp.gameRecords).filter((g) => g.completed).length;
          const totalStars = Object.values(cp.gameRecords).reduce((s, g) => s + (g.stars ?? 0), 0);
          const chapFavs = progress.favorites.filter((f) => f.chapterId === chapId).length;
          const completedGameEntries = GAMES_CATALOG.filter((g) => cp.gameRecords[g.id]);

          return (
            <article
              key={chapId}
              className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#800020]">
                    {bundle.title}
                  </h2>
                  <p className="text-sm text-[#6E4A52]">{bundle.subtitleEs}</p>
                  <p className="text-xs font-armenian text-[#800020] mt-0.5">{bundle.subtitleHy}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onContinueChapter(chapId, cp.lastVideoTime)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Continuar aprendiendo ({formatTime(cp.lastVideoTime)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmTarget(chapId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EBD9C4] text-xs font-semibold text-[#A51C30] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar capítulo
                  </button>
                </div>
              </div>

              {/* Video Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52]">
                  <span>
                    Última posición del vídeo: <strong className="font-mono text-[#2B1419]">{formatTime(cp.lastVideoTime)}</strong>
                  </span>
                  <span className="text-[#800020] tabular-nums">{watchedPct}% visto</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#FFF8E7] border border-[#EBD9C4] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#800020] to-[#FF9800] transition-all"
                    style={{ width: `${watchedPct}%` }}
                  />
                </div>
              </div>

              {/* Chapter Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Vocabulario</span>
                  <span className="text-base font-bold text-[#2B1419] tabular-nums">
                    {cp.knownVocabIds.length}/{bundle.vocabulary.length}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Gramática</span>
                  <span className="text-base font-bold text-[#2B1419] tabular-nums">
                    {cp.completedGrammarIds.length}/{bundle.grammar.length}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Juegos</span>
                  <span className="text-base font-bold text-[#2B1419] tabular-nums">
                    {gamesDone}/18
                  </span>
                </div>
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Estrellas</span>
                  <span className="text-base font-bold text-[#FF9800] tabular-nums inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" fill="currentColor" />
                    {totalStars}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Favoritos</span>
                  <span className="text-base font-bold text-[#2B1419] tabular-nums">{chapFavs}</span>
                </div>
                <div className="rounded-xl bg-[#FFF8E7]/70 border border-[#EBD9C4] p-3">
                  <span className="block text-[11px] font-semibold text-[#6E4A52]">Estudio</span>
                  <span className="text-base font-bold text-[#2B1419] tabular-nums">
                    {formatStudyTime(cp.studySeconds)}
                  </span>
                </div>
              </div>

              {/* Per-Game Resettable Records */}
              {completedGameEntries.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#EBD9C4]/70">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
                    Mejores resultados en juegos (Capítulo {chapId})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {completedGameEntries.map((meta) => {
                      const rec = cp.gameRecords[meta.id];
                      return (
                        <div
                          key={meta.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF8E7]/60 border border-[#EBD9C4] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#2B1419] truncate">
                              {meta.number}. {meta.title}
                            </p>
                            <p className="text-[#6E4A52] tabular-nums">
                              Mejor: {rec.bestScore}/{rec.totalQuestions} · {rec.stars ?? 0} ★
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onResetGame(chapId, meta.id)}
                            className="shrink-0 text-[#A51C30] hover:underline font-semibold cursor-pointer"
                            title="Reiniciar ejercicio"
                          >
                            Reiniciar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmTarget !== null}
        title={
          confirmTarget === 'all'
            ? '¿Reiniciar todo el progreso?'
            : `¿Reiniciar el progreso del Capítulo ${confirmTarget}?`
        }
        description={
          confirmTarget === 'all'
            ? 'Se borrarán el historial de vídeos, las palabras marcadas como conocidas, los resultados de los juegos, los puntos y tus favoritos en los tres capítulos.'
            : `Se restablecerán la posición del vídeo, el vocabulario aprendido, la gramática y los juegos del Capítulo ${confirmTarget}.`
        }
        descriptionHy={
          confirmTarget === 'all'
            ? 'Կջնջվեն բոլոր երեք սերիաների դիտման դիրքերը, սովորած բառերը, խաղերի արդյունքները և պահպանված էջանիշերը։'
            : `Կզրոյացվեն ${confirmTarget}-րդ սերիայի տեսանյութի դիրքը, բառապաշարի և խաղերի արդյունքները։`
        }
        confirmLabel={confirmTarget === 'all' ? 'Sí, reiniciar todo' : 'Sí, reiniciar capítulo'}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget === 'all') {
            onResetAll();
          } else if (confirmTarget !== null) {
            onResetChapter(confirmTarget);
          }
          setConfirmTarget(null);
        }}
      />
    </section>
  );
};
