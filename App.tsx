import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  X,
  Play,
  BookOpen,
  GraduationCap,
  Gamepad2,
  Bookmark,
  BarChart3,
  Compass,
  Film,
  FileText,
  Home,
  ChevronRight,
  Clock,
  Award,
} from 'lucide-react';
import {
  AppProgressState,
  AppSection,
  ChapterBundle,
  ChapterId,
  ChapterTab,
  FavoriteItem,
  SubtitleDataset,
  SubtitleLine,
} from './types';
import {
  loadProgress,
  recordGameResult,
  resetAllProgress,
  resetChapterProgress,
  resetSingleGameProgress,
  saveProgress,
  toggleFavoriteItem,
} from './storage';
import { DATA_CAP_18 } from './dataCap18';
import { DATA_CAP_19 } from './dataCap19';
import { DATA_CAP_20 } from './dataCap20';
import rawSubs18 from './subtitlesCap18.json';
import rawSubs19 from './subtitlesCap19.json';
import rawSubs20 from './subtitlesCap20.json';
import { SeekRequest, YouTubeLessonPlayer } from './youtubePlayer';
import { TranscriptView } from './transcriptView';
import { VocabularyView } from './vocabularyView';
import { ArgentinoView } from './argentinoView';
import { GrammarView } from './grammarView';
import { GamesView } from './gamesView';
import { FavoritesView } from './favoritesView';
import { ProgressView } from './progressView';
import { CoverImageWithFallback, formatStudyTime, formatTime } from './uiHelpers';

const CHAPTERS: Record<ChapterId, ChapterBundle> = {
  18: DATA_CAP_18,
  19: DATA_CAP_19,
  20: DATA_CAP_20,
};

const BASE_SUBTITLES: Record<ChapterId, SubtitleDataset> = {
  18: rawSubs18 as SubtitleDataset,
  19: rawSubs19 as SubtitleDataset,
  20: rawSubs20 as SubtitleDataset,
};

const ALL_NAV_ITEMS: { id: AppSection; label: string; icon: React.ReactNode }[] = [
  { id: 'inicio', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
  { id: 'cap18', label: 'Capítulo 18', icon: <Film className="w-4 h-4" /> },
  { id: 'cap19', label: 'Capítulo 19', icon: <Film className="w-4 h-4" /> },
  { id: 'cap20', label: 'Capítulo 20', icon: <Film className="w-4 h-4" /> },
  { id: 'videos', label: 'Vídeos', icon: <Play className="w-4 h-4" /> },
  { id: 'transcripciones', label: 'Transcripción completa', icon: <FileText className="w-4 h-4" /> },
  { id: 'vocabulario', label: 'Vocabulario', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'argentino', label: 'Español argentino', icon: <Compass className="w-4 h-4" /> },
  { id: 'gramatica', label: 'Gramática', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'juegos', label: 'Juegos', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'favoritos', label: 'Mis favoritos', icon: <Bookmark className="w-4 h-4" /> },
  { id: 'progreso', label: 'Mi progreso', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function App() {
  const [progress, setProgress] = useState<AppProgressState>(() => loadProgress());
  const [activeSection, setActiveSection] = useState<AppSection>('inicio');
  const [selectedChapter, setSelectedChapter] = useState<ChapterId>(18);
  const [chapterTab, setChapterTab] = useState<ChapterTab>('video');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Per-chapter playback state (starts at 0:00 by default when opening an episode)
  const [videoTimes, setVideoTimes] = useState<Record<ChapterId, number>>({ 18: 0, 19: 0, 20: 0 });
  const [isPlayingMap, setIsPlayingMap] = useState<Record<ChapterId, boolean>>({
    18: false,
    19: false,
    20: false,
  });
  const [seekRequests, setSeekRequests] = useState<Record<ChapterId, SeekRequest | null>>({
    18: null,
    19: null,
    20: null,
  });
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  const seekCounterRef = useRef(1);
  const lastSavedTimeRef = useRef<Record<ChapterId, number>>({ 18: 0, 19: 0, 20: 0 });

  // Active chapter derived from section
  const effectiveChapter: ChapterId =
    activeSection === 'cap18'
      ? 18
      : activeSection === 'cap19'
        ? 19
        : activeSection === 'cap20'
          ? 20
          : selectedChapter;

  // Track active study time every 15 seconds while the page is visible
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (activeSection === 'inicio') return;
      setProgress((prev) => {
        const chap = prev.chapters[effectiveChapter];
        const next: AppProgressState = {
          ...prev,
          chapters: {
            ...prev.chapters,
            [effectiveChapter]: {
              ...chap,
              studySeconds: chap.studySeconds + 15,
            },
          },
        };
        saveProgress(next);
        return next;
      });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [activeSection, effectiveChapter]);

  const navigateTo = (section: AppSection, chap?: ChapterId, tab?: ChapterTab) => {
    setActiveSection(section);
    if (section === 'cap18') setSelectedChapter(18);
    else if (section === 'cap19') setSelectedChapter(19);
    else if (section === 'cap20') setSelectedChapter(20);
    else if (chap) setSelectedChapter(chap);

    if (tab) setChapterTab(tab);
    else if (section === 'cap18' || section === 'cap19' || section === 'cap20') {
      setChapterTab('video');
    }

    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const nextChapter: ChapterId =
      section === 'cap18' ? 18 : section === 'cap19' ? 19 : section === 'cap20' ? 20 : chap ?? selectedChapter;

    setProgress((prev) => {
      const next: AppProgressState = {
        ...prev,
        lastActiveChapter: nextChapter,
        lastActiveSection: section,
      };
      saveProgress(next);
      return next;
    });
  };

  const triggerSeek = useCallback((chapterId: ChapterId, seconds: number, autoplay = true) => {
    const seq = ++seekCounterRef.current;
    setVideoTimes((prev) => ({ ...prev, [chapterId]: Math.max(0, seconds) }));
    setSeekRequests((prev) => ({
      ...prev,
      [chapterId]: { time: Math.max(0, seconds), seq, autoplay },
    }));
  }, []);

  const handleJumpToVideo = useCallback(
    (chapterId: ChapterId, seconds: number) => {
      const targetSec: AppSection = chapterId === 18 ? 'cap18' : chapterId === 19 ? 'cap19' : 'cap20';
      setActiveSection(targetSec);
      setSelectedChapter(chapterId);
      setChapterTab('video');
      triggerSeek(chapterId, seconds, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [triggerSeek]
  );

  const handlePlayerTimeUpdate = useCallback(
    (chapterId: ChapterId, time: number, duration: number, isPlaying: boolean) => {
      setVideoTimes((prev) => ({ ...prev, [chapterId]: time }));
      setIsPlayingMap((prev) => (prev[chapterId] === isPlaying ? prev : { ...prev, [chapterId]: isPlaying }));

      // Persist video progress throttled every >= 3 seconds delta
      if (Math.abs(time - lastSavedTimeRef.current[chapterId]) >= 3) {
        lastSavedTimeRef.current[chapterId] = time;
        setProgress((prev) => {
          const chap = prev.chapters[chapterId];
          const next: AppProgressState = {
            ...prev,
            lastActiveChapter: chapterId,
            chapters: {
              ...prev.chapters,
              [chapterId]: {
                ...chap,
                lastVideoTime: Math.floor(time),
                maxVideoTime: Math.max(chap.maxVideoTime, Math.floor(time)),
                videoDuration: duration > 0 ? Math.floor(duration) : chap.videoDuration,
              },
            },
          };
          saveProgress(next);
          return next;
        });
      }
    },
    []
  );

  const handleToggleFavorite = useCallback((item: Omit<FavoriteItem, 'savedAt'>) => {
    setProgress((prev) => toggleFavoriteItem(prev, item));
  }, []);

  const handleToggleKnownVocab = useCallback((chapterId: ChapterId, vocabId: string) => {
    setProgress((prev) => {
      const chap = prev.chapters[chapterId];
      const exists = chap.knownVocabIds.includes(vocabId);
      const knownVocabIds = exists
        ? chap.knownVocabIds.filter((id) => id !== vocabId)
        : [...chap.knownVocabIds, vocabId];
      const next: AppProgressState = {
        ...prev,
        chapters: {
          ...prev.chapters,
          [chapterId]: {
            ...chap,
            knownVocabIds,
            points: exists ? chap.points : chap.points + 5,
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleCompleteGrammar = useCallback((chapterId: ChapterId, grammarId: string) => {
    setProgress((prev) => {
      const chap = prev.chapters[chapterId];
      if (chap.completedGrammarIds.includes(grammarId)) return prev;
      const next: AppProgressState = {
        ...prev,
        chapters: {
          ...prev.chapters,
          [chapterId]: {
            ...chap,
            completedGrammarIds: [...chap.completedGrammarIds, grammarId],
            points: chap.points + 20,
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleRecordGame = useCallback(
    (
      chapterId: ChapterId,
      gameId: string,
      score: number,
      totalQuestions: number,
      extra?: { bestTimeSec?: number; stars?: number; bonusPoints?: number }
    ) => {
      setProgress((prev) => recordGameResult(prev, chapterId, gameId, score, totalQuestions, extra));
    },
    []
  );

  const handleResetGame = useCallback((chapterId: ChapterId, gameId: string) => {
    setProgress((prev) => resetSingleGameProgress(prev, chapterId, gameId));
  }, []);

  const handleResetChapter = useCallback((chapterId: ChapterId) => {
    setProgress((prev) => resetChapterProgress(prev, chapterId));
    setVideoTimes((prev) => ({ ...prev, [chapterId]: 0 }));
  }, []);

  const handleResetAll = useCallback(() => {
    setProgress(resetAllProgress());
    setVideoTimes({ 18: 0, 19: 0, 20: 0 });
  }, []);

  const handleSaveSpeakingNote = useCallback((chapterId: ChapterId, qId: string, text: string) => {
    setProgress((prev) => {
      const chap = prev.chapters[chapterId];
      const next: AppProgressState = {
        ...prev,
        chapters: {
          ...prev.chapters,
          [chapterId]: {
            ...chap,
            speakingNotes: { ...chap.speakingNotes, [qId]: text },
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleSaveStoryDraft = useCallback((chapterId: ChapterId, sceneId: string, text: string) => {
    setProgress((prev) => {
      const chap = prev.chapters[chapterId];
      const next: AppProgressState = {
        ...prev,
        chapters: {
          ...prev.chapters,
          [chapterId]: {
            ...chap,
            storyDrafts: { ...chap.storyDrafts, [sceneId]: text },
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleFinishArgentino = useCallback((score: number, total: number) => {
    setProgress((prev) => {
      const next: AppProgressState = {
        ...prev,
        argentinoScore: {
          best: Math.max(prev.argentinoScore.best, score),
          total,
          attempts: prev.argentinoScore.attempts + 1,
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const getSubtitlesForChapter = (chapId: ChapterId): SubtitleLine[] => {
    return BASE_SUBTITLES[chapId].lines;
  };

  const hasAnySavedProgress = useMemo(() => {
    return ([18, 19, 20] as ChapterId[]).some((id) => {
      const c = progress.chapters[id];
      return c.lastVideoTime > 0 || c.points > 0 || c.knownVocabIds.length > 0;
    });
  }, [progress]);

  const totalPoints =
    progress.chapters[18].points + progress.chapters[19].points + progress.chapters[20].points;

  const renderChapterSwitcher = (label: string) => (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <span className="text-sm font-semibold text-[#6E4A52]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {([18, 19, 20] as ChapterId[]).map((cid) => (
          <button
            key={cid}
            type="button"
            onClick={() => setSelectedChapter(cid)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              selectedChapter === cid
                ? 'bg-[#800020] text-white border-[#800020]'
                : 'bg-[#FFF8E7] text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
            }`}
          >
            Capítulo {cid}
          </button>
        ))}
      </div>
    </div>
  );

  const renderChapterWorkspace = (chapId: ChapterId) => {
    const bundle = CHAPTERS[chapId];
    const subs = getSubtitlesForChapter(chapId);
    const chapProg = progress.chapters[chapId];

    const tabs: { id: ChapterTab; label: string; icon: React.ReactNode }[] = [
      { id: 'video', label: 'Vídeo y subtítulos', icon: <Play className="w-4 h-4" /> },
      { id: 'transcripcion', label: `Transcripción completa (${subs.length})`, icon: <FileText className="w-4 h-4" /> },
      { id: 'vocabulario', label: `Vocabulario (${bundle.vocabulary.length})`, icon: <BookOpen className="w-4 h-4" /> },
      { id: 'gramatica', label: `Gramática (${bundle.grammar.length})`, icon: <GraduationCap className="w-4 h-4" /> },
      { id: 'juegos', label: 'Juegos (18)', icon: <Gamepad2 className="w-4 h-4" /> },
    ];

    return (
      <div className="space-y-6">
        {/* Chapter Header Card */}
        <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
              <span>Muñeca Brava</span>
              <span aria-hidden="true">·</span>
              <span>{bundle.title}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{chapProg.points} pts</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419]">
              {bundle.title}: {bundle.subtitleEs}
            </h1>
            <p className="text-sm font-armenian text-[#800020]">{bundle.subtitleHy}</p>
          </div>

          {chapProg.lastVideoTime > 10 && (
            <button
              type="button"
              onClick={() => {
                setChapterTab('video');
                triggerSeek(chapId, chapProg.lastVideoTime, true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF8E7] border border-[#FFD54F] text-xs sm:text-sm font-semibold text-[#800020] hover:bg-[#FFD54F]/30 transition-colors cursor-pointer whitespace-nowrap self-start lg:self-center"
            >
              <Play className="w-4 h-4" />
              Retomar en {formatTime(chapProg.lastVideoTime)}
            </button>
          )}
        </div>

        {/* Chapter Internal Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChapterTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                chapterTab === tab.id
                  ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                  : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {chapterTab === 'video' && (
          <div className="space-y-6">
            <YouTubeLessonPlayer
              chapterId={chapId}
              chapterTitle={bundle.title}
              youtubeId={bundle.youtubeId}
              youtubeUrl={bundle.youtubeUrl}
              durationApproxSec={bundle.durationApproxSec}
              subtitles={subs}
              currentTime={videoTimes[chapId]}
              seekRequest={seekRequests[chapId]}
              showAllTranslations={showAllTranslations}
              onToggleShowAllTranslations={setShowAllTranslations}
              onTimeUpdate={(t, d, playing) => handlePlayerTimeUpdate(chapId, t, d, playing)}
              favorites={progress.favorites}
              onToggleFavorite={handleToggleFavorite}
            />

            <TranscriptView
              chapterId={chapId}
              subtitles={subs}
              currentTime={videoTimes[chapId]}
              isPlaying={isPlayingMap[chapId]}
              showAllTranslations={showAllTranslations}
              onToggleShowAllTranslations={setShowAllTranslations}
              onSeekToLine={(sec, auto) => triggerSeek(chapId, sec, auto ?? true)}
              favorites={progress.favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {chapterTab === 'transcripcion' && (
          <TranscriptView
            chapterId={chapId}
            subtitles={subs}
            currentTime={videoTimes[chapId]}
            isPlaying={isPlayingMap[chapId]}
            showAllTranslations={showAllTranslations}
            onToggleShowAllTranslations={setShowAllTranslations}
            onSeekToLine={(sec) => {
              setChapterTab('video');
              triggerSeek(chapId, sec, true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            favorites={progress.favorites}
            onToggleFavorite={handleToggleFavorite}
            standalone
          />
        )}

        {chapterTab === 'vocabulario' && (
          <VocabularyView
            chapterId={chapId}
            items={bundle.vocabulary}
            knownVocabIds={chapProg.knownVocabIds}
            favorites={progress.favorites}
            onToggleKnown={handleToggleKnownVocab}
            onToggleFavorite={handleToggleFavorite}
            onJumpToVideo={handleJumpToVideo}
          />
        )}

        {chapterTab === 'gramatica' && (
          <GrammarView
            chapterId={chapId}
            items={bundle.grammar}
            completedGrammarIds={chapProg.completedGrammarIds}
            favorites={progress.favorites}
            onCompleteGrammar={handleCompleteGrammar}
            onToggleFavorite={handleToggleFavorite}
            onJumpToVideo={handleJumpToVideo}
          />
        )}

        {chapterTab === 'juegos' && (
          <GamesView
            chapterId={chapId}
            games={bundle.games}
            records={chapProg.gameRecords}
            speakingNotes={chapProg.speakingNotes}
            storyDrafts={chapProg.storyDrafts}
            onRecordResult={handleRecordGame}
            onResetGame={handleResetGame}
            onSaveSpeakingNote={handleSaveSpeakingNote}
            onSaveStoryDraft={handleSaveStoryDraft}
            onJumpToVideo={handleJumpToVideo}
          />
        )}
      </div>
    );
  };

  const renderHome = () => {
    const lastChap = progress.lastActiveChapter;
    const lastTime = progress.chapters[lastChap].lastVideoTime;

    return (
      <div className="space-y-10">
        {/* Hero Banner */}
        <section className="relative rounded-3xl overflow-hidden border border-[#EBD9C4] shadow-md min-h-[340px] sm:min-h-[400px] flex items-end bg-gradient-to-br from-[#2B1419] via-[#800020] to-[#A51C30]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(255,213,79,0.28),transparent_48%),radial-gradient(circle_at_15%_85%,rgba(229,57,53,0.35),transparent_52%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E0B10]/90 via-[#2B1419]/45 to-transparent" />

          <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12 text-[#FFF8E7] space-y-4">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#FFD54F]">
              Capítulos 18, 19 y 20 · Español argentino — Armenio oriental
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
              Muñeca Brava
            </h1>
            <p className="text-lg sm:text-xl text-[#FFF8E7]/95 max-w-2xl leading-relaxed font-medium">
              Aprende español con cada escena, cada palabra y cada emoción.
            </p>
            <p className="text-sm sm:text-base text-[#FFD54F] font-armenian max-w-2xl">
              Սովորիր արգենտինական իսպաներեն «Վայրի հրեշտակ» սերիալի կենդանի երկխոսություններով, հայերեն թարգմանություններով, քերականությամբ և 18 խաղերով։
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {hasAnySavedProgress ? (
                <button
                  type="button"
                  onClick={() => handleJumpToVideo(lastChap, lastTime)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF9800] text-[#2B1419] font-bold text-sm sm:text-base hover:bg-[#FFD54F] transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Continuar aprendiendo · Cap. {lastChap}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('cap18', 18, 'video')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E53935] text-white font-bold text-sm sm:text-base hover:bg-[#A51C30] transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Empezar Capítulo 18
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTo('argentino')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-[#FFF8E7] border border-white/25 font-semibold text-sm sm:text-base transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#FFD54F]" />
                Español argentino
              </button>
            </div>
          </div>
        </section>

        {/* Three Independent Episode Cards */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419]">
                Elige tu capítulo
              </h2>
              <p className="text-sm text-[#6E4A52] mt-1">
                Cada episodio incluye reproductor interactivo, transcripción sincronizada, 50 palabras clave, gramática en contexto y 18 juegos independientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([18, 19, 20] as ChapterId[]).map((cid) => {
              const bundle = CHAPTERS[cid];
              const cp = progress.chapters[cid];
              const watchedPct = Math.min(
                100,
                Math.round((cp.maxVideoTime / Math.max(cp.videoDuration || bundle.durationApproxSec, 1)) * 100)
              );
              const gamesDone = Object.values(cp.gameRecords).filter((g) => g.completed).length;

              return (
                <article
                  key={cid}
                  className="bg-white rounded-2xl border border-[#EBD9C4] shadow-sm overflow-hidden flex flex-col justify-between group hover:border-[#800020] transition-all"
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-[#2B1419]">
                      <CoverImageWithFallback
                        src={bundle.coverImage}
                        alt={bundle.title}
                        fallbackTitle={bundle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2B1419]/90 via-[#2B1419]/25 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-[#FFF8E7]">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#FFD54F] tabular-nums">
                          {BASE_SUBTITLES[cid].lines.length} réplicas originales · Armenio completo
                        </span>
                        <h3 className="font-display text-2xl font-bold leading-tight">
                          {bundle.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <p className="font-semibold text-[#2B1419] text-base">{bundle.subtitleEs}</p>
                        <p className="text-xs font-armenian text-[#800020] mt-0.5">
                          {bundle.subtitleHy}
                        </p>
                      </div>

                      <ul className="space-y-1 text-xs text-[#6E4A52]">
                        {bundle.highlightsEs.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-[#A51C30] shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Mini Progress */}
                      <div className="pt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[#6E4A52] tabular-nums">
                          <span>Vídeo: {watchedPct}% · Juegos: {gamesDone}/18</span>
                          <span>Palabras: {cp.knownVocabIds.length}/50</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#FFF8E7] border border-[#EBD9C4] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#800020] to-[#FF9800]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (watchedPct + (gamesDone / 18) * 100 + (cp.knownVocabIds.length / 50) * 100) /
                                    3
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo(cid === 18 ? 'cap18' : cid === 19 ? 'cap19' : 'cap20', cid, 'video')}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      Abrir {bundle.title}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Quick Study Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => navigateTo('argentino')}
            className="text-left bg-white rounded-2xl border border-[#EBD9C4] p-5 hover:border-[#800020] transition-colors cursor-pointer space-y-2"
          >
            <Compass className="w-6 h-6 text-[#800020]" />
            <h3 className="font-display text-xl font-bold text-[#2B1419]">Español argentino</h3>
            <p className="text-sm text-[#6E4A52]">
              Domina el voseo (tenés, sabés, sos), el imperativo (vení, decime) y 20 ejercicios interactivos «tú ↔ vos».
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('favoritos')}
            className="text-left bg-white rounded-2xl border border-[#EBD9C4] p-5 hover:border-[#800020] transition-colors cursor-pointer space-y-2"
          >
            <Bookmark className="w-6 h-6 text-[#A51C30]" />
            <h3 className="font-display text-xl font-bold text-[#2B1419]">
              Mis favoritos ({progress.favorites.length})
            </h3>
            <p className="text-sm text-[#6E4A52]">
              Repasa con tarjetas interactivas tus palabras, expresiones, réplicas y momentos guardados.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('progreso')}
            className="text-left bg-white rounded-2xl border border-[#EBD9C4] p-5 hover:border-[#800020] transition-colors cursor-pointer space-y-2"
          >
            <BarChart3 className="w-6 h-6 text-[#FF9800]" />
            <h3 className="font-display text-xl font-bold text-[#2B1419]">Mi progreso</h3>
            <p className="text-sm text-[#6E4A52]">
              Consulta tus {totalPoints} puntos, estadísticas por capítulo y retoma exactamente donde lo dejaste.
            </p>
          </button>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8E7] text-[#2B1419]">
      {/* Slim Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-[#800020] text-[#FFF8E7] border-b border-[#FFD54F]/25 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigateTo('inicio')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <span className="w-9 h-9 rounded-xl bg-[#FFD54F] text-[#800020] font-display font-black text-lg flex items-center justify-center shadow-2xs">
              M
            </span>
            <div className="leading-tight">
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight block whitespace-nowrap">
                Muñeca Brava
              </span>
              <span className="hidden sm:block text-[11px] text-[#FFD54F] whitespace-nowrap">
                Aprende español · Cap. 18, 19 y 20
              </span>
            </div>
          </button>

          {/* Primary Single-Line Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Navegación principal">
            {(
              [
                ['inicio', 'Inicio'],
                ['cap18', 'Cap. 18'],
                ['cap19', 'Cap. 19'],
                ['cap20', 'Cap. 20'],
                ['argentino', 'Argentino'],
                ['juegos', 'Juegos'],
                ['favoritos', 'Favoritos'],
                ['progreso', 'Progreso'],
              ] as [AppSection, string][]
            ).map(([sec, label]) => (
              <button
                key={sec}
                type="button"
                onClick={() => navigateTo(sec)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === sec
                    ? 'bg-[#FFD54F] text-[#2B1419]'
                    : 'text-[#FFF8E7]/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right Quick Info + Full 12-Section Menu Drawer Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-[#FFD54F] mr-1 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {totalPoints} pts
              </span>
              <span className="inline-flex items-center gap-1 text-[#FFF8E7]/85">
                <Clock className="w-3.5 h-3.5" />
                {formatStudyTime(
                  progress.chapters[18].studySeconds +
                    progress.chapters[19].studySeconds +
                    progress.chapters[20].studySeconds
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8E7] text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menú completo de secciones"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>Menú</span>
            </button>
          </div>
        </div>

        {/* Full 12-Section Expandable Menu Panel */}
        {mobileMenuOpen && (
          <div className="bg-[#2B1419] border-t border-[#FFD54F]/20 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {ALL_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-left ${
                    activeSection === item.id
                      ? 'bg-[#FFD54F] text-[#2B1419]'
                      : 'bg-white/5 text-[#FFF8E7] hover:bg-white/15'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeSection === 'inicio' && renderHome()}
        {activeSection === 'cap18' && renderChapterWorkspace(18)}
        {activeSection === 'cap19' && renderChapterWorkspace(19)}
        {activeSection === 'cap20' && renderChapterWorkspace(20)}

        {activeSection === 'videos' && (
          <div className="space-y-6">
            {renderChapterSwitcher('Selecciona un capítulo para ver el vídeo y subtítulos interactivos:')}
            <YouTubeLessonPlayer
              chapterId={selectedChapter}
              chapterTitle={CHAPTERS[selectedChapter].title}
              youtubeId={CHAPTERS[selectedChapter].youtubeId}
              youtubeUrl={CHAPTERS[selectedChapter].youtubeUrl}
              durationApproxSec={CHAPTERS[selectedChapter].durationApproxSec}
              subtitles={getSubtitlesForChapter(selectedChapter)}
              currentTime={videoTimes[selectedChapter]}
              seekRequest={seekRequests[selectedChapter]}
              showAllTranslations={showAllTranslations}
              onToggleShowAllTranslations={setShowAllTranslations}
              onTimeUpdate={(t, d, playing) => handlePlayerTimeUpdate(selectedChapter, t, d, playing)}
              favorites={progress.favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {activeSection === 'transcripciones' && (
          <div className="space-y-6">
            {renderChapterSwitcher('Selecciona un capítulo para explorar su transcripción completa:')}
            <TranscriptView
              chapterId={selectedChapter}
              subtitles={getSubtitlesForChapter(selectedChapter)}
              currentTime={videoTimes[selectedChapter]}
              isPlaying={isPlayingMap[selectedChapter]}
              showAllTranslations={showAllTranslations}
              onToggleShowAllTranslations={setShowAllTranslations}
              onSeekToLine={(sec) => handleJumpToVideo(selectedChapter, sec)}
              favorites={progress.favorites}
              onToggleFavorite={handleToggleFavorite}
              standalone
            />
          </div>
        )}

        {activeSection === 'vocabulario' && (
          <div className="space-y-6">
            {renderChapterSwitcher('Vocabulario esencial por episodio:')}
            <VocabularyView
              chapterId={selectedChapter}
              items={CHAPTERS[selectedChapter].vocabulary}
              knownVocabIds={progress.chapters[selectedChapter].knownVocabIds}
              favorites={progress.favorites}
              onToggleKnown={handleToggleKnownVocab}
              onToggleFavorite={handleToggleFavorite}
              onJumpToVideo={handleJumpToVideo}
            />
          </div>
        )}

        {activeSection === 'argentino' && (
          <ArgentinoView
            bestScore={progress.argentinoScore.best}
            attempts={progress.argentinoScore.attempts}
            onFinishPractice={handleFinishArgentino}
          />
        )}

        {activeSection === 'gramatica' && (
          <div className="space-y-6">
            {renderChapterSwitcher('Gramática en contexto por episodio:')}
            <GrammarView
              chapterId={selectedChapter}
              items={CHAPTERS[selectedChapter].grammar}
              completedGrammarIds={progress.chapters[selectedChapter].completedGrammarIds}
              favorites={progress.favorites}
              onCompleteGrammar={handleCompleteGrammar}
              onToggleFavorite={handleToggleFavorite}
              onJumpToVideo={handleJumpToVideo}
            />
          </div>
        )}

        {activeSection === 'juegos' && (
          <div className="space-y-6">
            {renderChapterSwitcher('Elige el capítulo para practicar sus 18 juegos:')}
            <GamesView
              chapterId={selectedChapter}
              games={CHAPTERS[selectedChapter].games}
              records={progress.chapters[selectedChapter].gameRecords}
              speakingNotes={progress.chapters[selectedChapter].speakingNotes}
              storyDrafts={progress.chapters[selectedChapter].storyDrafts}
              onRecordResult={handleRecordGame}
              onResetGame={handleResetGame}
              onSaveSpeakingNote={handleSaveSpeakingNote}
              onSaveStoryDraft={handleSaveStoryDraft}
              onJumpToVideo={handleJumpToVideo}
            />
          </div>
        )}

        {activeSection === 'favoritos' && (
          <FavoritesView
            favorites={progress.favorites}
            onRemoveFavorite={handleToggleFavorite}
            onJumpToVideo={handleJumpToVideo}
          />
        )}

        {activeSection === 'progreso' && (
          <ProgressView
            progress={progress}
            chapters={CHAPTERS}
            onContinueChapter={handleJumpToVideo}
            onResetChapter={handleResetChapter}
            onResetGame={handleResetGame}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-[#2B1419] text-[#FFF8E7]/80 border-t border-[#FFD54F]/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-display font-bold text-[#FFD54F] text-sm">
              Muñeca Brava — Aprende español | Capítulos 18, 19 y 20
            </span>
            <p className="mt-0.5 text-[#FFF8E7]/70">
              Aprende español con cada escena, cada palabra y cada emoción.
            </p>
          </div>
          <p className="font-armenian text-[#FFD54F]/90">
            Իսպաներենի ուսուցում արևելահայերեն թարգմանություններով
          </p>
        </div>
      </footer>
    </div>
  );
}
