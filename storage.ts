import { AppProgressState, ChapterId, ChapterProgress, FavoriteItem, GameProgressRecord } from './types';

const PROGRESS_KEY = 'muneca_brava_progress_v1';

function createEmptyChapterProgress(chapterId: ChapterId): ChapterProgress {
  return {
    chapterId,
    lastVideoTime: 0,
    maxVideoTime: 0,
    videoDuration: 2640,
    knownVocabIds: [],
    completedGrammarIds: [],
    gameRecords: {},
    points: 0,
    studySeconds: 0,
    storyDrafts: {},
    speakingNotes: {},
  };
}

export function createInitialProgress(): AppProgressState {
  return {
    chapters: {
      18: createEmptyChapterProgress(18),
      19: createEmptyChapterProgress(19),
      20: createEmptyChapterProgress(20),
    },
    favorites: [],
    argentinoScore: { best: 0, total: 20, attempts: 0 },
    lastActiveChapter: 18,
    lastActiveSection: 'inicio',
  };
}

export function loadProgress(): AppProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<AppProgressState>;
    const base = createInitialProgress();
    return {
      chapters: {
        18: { ...base.chapters[18], ...(parsed.chapters?.[18] ?? {}) },
        19: { ...base.chapters[19], ...(parsed.chapters?.[19] ?? {}) },
        20: { ...base.chapters[20], ...(parsed.chapters?.[20] ?? {}) },
      },
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      argentinoScore: parsed.argentinoScore ?? base.argentinoScore,
      lastActiveChapter: parsed.lastActiveChapter ?? 18,
      lastActiveSection: parsed.lastActiveSection ?? 'inicio',
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(state: AppProgressState): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetChapterProgress(state: AppProgressState, chapterId: ChapterId): AppProgressState {
  const next: AppProgressState = {
    ...state,
    chapters: {
      ...state.chapters,
      [chapterId]: createEmptyChapterProgress(chapterId),
    },
  };
  saveProgress(next);
  return next;
}

export function resetSingleGameProgress(
  state: AppProgressState,
  chapterId: ChapterId,
  gameId: string
): AppProgressState {
  const chap = state.chapters[chapterId];
  const updatedRecords = { ...chap.gameRecords };
  delete updatedRecords[gameId];
  const next: AppProgressState = {
    ...state,
    chapters: {
      ...state.chapters,
      [chapterId]: {
        ...chap,
        gameRecords: updatedRecords,
      },
    },
  };
  saveProgress(next);
  return next;
}

export function resetAllProgress(): AppProgressState {
  const fresh = createInitialProgress();
  saveProgress(fresh);
  return fresh;
}

export function recordGameResult(
  state: AppProgressState,
  chapterId: ChapterId,
  gameId: string,
  score: number,
  totalQuestions: number,
  extra?: { bestTimeSec?: number; stars?: number; bonusPoints?: number }
): AppProgressState {
  const chap = state.chapters[chapterId];
  const prev: GameProgressRecord | undefined = chap.gameRecords[gameId];
  const bestScore = prev ? Math.max(prev.bestScore, score) : score;
  const bestTimeSec =
    extra?.bestTimeSec !== undefined
      ? prev?.bestTimeSec !== undefined
        ? Math.min(prev.bestTimeSec, extra.bestTimeSec)
        : extra.bestTimeSec
      : prev?.bestTimeSec;
  const stars =
    extra?.stars !== undefined
      ? Math.max(prev?.stars ?? 0, extra.stars)
      : Math.max(prev?.stars ?? 0, score / Math.max(totalQuestions, 1) >= 0.85 ? 3 : score / Math.max(totalQuestions, 1) >= 0.6 ? 2 : score > 0 ? 1 : 0);

  const earnedPoints = score * 10 + (extra?.bonusPoints ?? 0);

  const next: AppProgressState = {
    ...state,
    chapters: {
      ...state.chapters,
      [chapterId]: {
        ...chap,
        points: chap.points + earnedPoints,
        gameRecords: {
          ...chap.gameRecords,
          [gameId]: {
            gameId,
            attempts: (prev?.attempts ?? 0) + 1,
            bestScore,
            totalQuestions,
            lastScore: score,
            completed: true,
            bestTimeSec,
            stars,
            updatedAt: Date.now(),
          },
        },
      },
    },
  };
  saveProgress(next);
  return next;
}

export function toggleFavoriteItem(state: AppProgressState, item: Omit<FavoriteItem, 'savedAt'>): AppProgressState {
  const exists = state.favorites.some((f) => f.id === item.id);
  const favorites = exists
    ? state.favorites.filter((f) => f.id !== item.id)
    : [{ ...item, savedAt: Date.now() }, ...state.favorites];
  const next: AppProgressState = { ...state, favorites };
  saveProgress(next);
  return next;
}
