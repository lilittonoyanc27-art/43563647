import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  SkipBack,
  Maximize2,
  Languages,
  Bookmark,
  ExternalLink,
  AlertCircle,
  Volume2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ChapterId, FavoriteItem, SubtitleLine } from './types';
import { formatTime, speakSpanish } from './uiHelpers';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number | undefined>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    const existing = document.getElementById('youtube-iframe-api-script');
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    const poll = window.setInterval(() => {
      if (window.YT && window.YT.Player) {
        window.clearInterval(poll);
        resolve();
      }
    }, 150);
  });

  return ytApiPromise;
}

export interface SeekRequest {
  time: number;
  seq: number;
  autoplay?: boolean;
}

interface YouTubeLessonPlayerProps {
  chapterId: ChapterId;
  chapterTitle: string;
  youtubeId: string;
  youtubeUrl: string;
  durationApproxSec: number;
  subtitles: SubtitleLine[];
  currentTime: number;
  seekRequest: SeekRequest | null;
  showAllTranslations: boolean;
  onToggleShowAllTranslations: (value: boolean) => void;
  onTimeUpdate: (time: number, duration: number, isPlaying: boolean) => void;
  favorites: FavoriteItem[];
  onToggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
}

export const YouTubeLessonPlayer: React.FC<YouTubeLessonPlayerProps> = ({
  chapterId,
  chapterTitle,
  youtubeId,
  youtubeUrl,
  durationApproxSec,
  subtitles,
  currentTime,
  seekRequest,
  showAllTranslations,
  onToggleShowAllTranslations,
  onTimeUpdate,
  favorites,
  onToggleFavorite,
}) => {
  const playerMountRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const lastSeqRef = useRef<number>(-1);
  const latestSeekRequestRef = useRef<SeekRequest | null>(seekRequest);
  latestSeekRequestRef.current = seekRequest;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(durationApproxSec);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [embedError, setEmbedError] = useState<number | null>(null);
  const [openLineIds, setOpenLineIds] = useState<Record<string, boolean>>({});
  const [localScrubTime, setLocalScrubTime] = useState<number | null>(null);

  const maxEpisodeDuration = useMemo(() => {
    const lastSubStart = subtitles.length ? subtitles[subtitles.length - 1].start + 15 : 0;
    return Math.max(duration || 0, durationApproxSec, lastSubStart, 1);
  }, [duration, durationApproxSec, subtitles]);

  // Initialize YouTube IFrame Player always starting at 0:00
  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setIsPlaying(false);
    setEmbedError(null);
    setDuration(durationApproxSec);
    setPlaybackRate(1);
    setOpenLineIds({});
    setLocalScrubTime(null);

    loadYouTubeApi().then(() => {
      if (cancelled || !playerMountRef.current || !window.YT?.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      // Create fresh child node for YT to replace
      playerMountRef.current.innerHTML = '';
      const targetDiv = document.createElement('div');
      targetDiv.className = 'w-full h-full';
      playerMountRef.current.appendChild(targetDiv);

      const player = new window.YT.Player(targetDiv, {
        videoId: youtubeId,
        playerVars: {
          start: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerRef.current = event.target;
            setIsReady(true);
            const d = event.target.getDuration();
            if (d && d > 0) setDuration(d);
            // Always start from beginning (0:00) on mount unless a seek request already arrived
            const pendingSeek = latestSeekRequestRef.current;
            if (pendingSeek && pendingSeek.seq !== lastSeqRef.current) {
              lastSeqRef.current = pendingSeek.seq;
              event.target.seekTo(Math.max(0, pendingSeek.time), true);
              if (pendingSeek.autoplay) event.target.playVideo();
            } else {
              event.target.seekTo(0, true);
              event.target.pauseVideo();
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const playing = event.data === 1;
            setIsPlaying(playing);
            const t = event.target.getCurrentTime?.() ?? 0;
            const d = event.target.getDuration?.() || durationApproxSec;
            if (d > 0) setDuration(d);
            onTimeUpdate(t, d, playing);
          },
          onError: (event) => {
            if (cancelled) return;
            setEmbedError(event.data);
          },
        },
      });

      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // Poll current playback time smoothly
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || !isReady) return;
      try {
        const t = p.getCurrentTime?.();
        const d = p.getDuration?.();
        const state = p.getPlayerState?.();
        const playing = state === 1;
        if (typeof d === 'number' && d > 0) setDuration(d);
        if (typeof t === 'number' && Number.isFinite(t)) {
          onTimeUpdate(t, d && d > 0 ? d : duration, playing);
        }
      } catch {
        // ignore transient iframe readiness error
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [isReady, duration, onTimeUpdate]);

  // Handle external seek requests (timestamp click, repeat, continue learning)
  useEffect(() => {
    if (!seekRequest || seekRequest.seq === lastSeqRef.current) return;
    if (!isReady || !playerRef.current) return;
    lastSeqRef.current = seekRequest.seq;
    const clamped = Math.max(0, Math.min(seekRequest.time, maxEpisodeDuration));
    try {
      playerRef.current.seekTo(clamped, true);
      if (seekRequest.autoplay) {
        playerRef.current.playVideo();
      }
      onTimeUpdate(clamped, maxEpisodeDuration, Boolean(seekRequest.autoplay));
    } catch {
      // ignore
    }
  }, [seekRequest, isReady, maxEpisodeDuration, onTimeUpdate]);

  const effectiveTime = localScrubTime !== null ? localScrubTime : currentTime;

  // Determine active subtitle line(s), preserving multiple lines that share the exact same timestamp
  const activeLines = useMemo(() => {
    if (!subtitles.length) return [];
    let activeStart = -1;
    for (let i = 0; i < subtitles.length; i++) {
      if (subtitles[i].start <= effectiveTime + 0.35) {
        activeStart = subtitles[i].start;
      } else {
        break;
      }
    }
    if (activeStart === -1) {
      const firstStart = subtitles[0].start;
      return subtitles.filter((line) => line.start === firstStart);
    }
    return subtitles.filter((line) => line.start === activeStart);
  }, [subtitles, effectiveTime]);

  const seekToTime = useCallback(
    (seconds: number, autoplay?: boolean) => {
      const clamped = Math.max(0, Math.min(seconds, maxEpisodeDuration));
      if (playerRef.current && isReady) {
        try {
          playerRef.current.seekTo(clamped, true);
          if (autoplay === true) playerRef.current.playVideo();
          if (autoplay === false) playerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      onTimeUpdate(clamped, maxEpisodeDuration, autoplay ?? isPlaying);
    },
    [maxEpisodeDuration, isReady, isPlaying, onTimeUpdate]
  );

  const handlePlay = () => {
    try {
      playerRef.current?.playVideo();
    } catch {
      // ignore
    }
  };

  const handlePause = () => {
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // ignore
    }
  };

  const handleRepeatPhrase = () => {
    const start = activeLines[0]?.start ?? Math.max(0, effectiveTime - 3);
    seekToTime(start, true);
  };

  const handleResetStart = () => {
    seekToTime(0, true);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    try {
      playerRef.current?.setPlaybackRate(rate);
    } catch {
      // ignore
    }
  };

  const handleFullscreen = () => {
    const el = playerWrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const toggleLineTranslation = (lineId: string) => {
    setOpenLineIds((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const currentMomentId = `video-${chapterId}-${Math.floor(effectiveTime)}`;
  const activeCue = activeLines[0];
  const isCueFavorited = activeCue ? favorites.some((f) => f.id === activeCue.id) : false;
  const isMomentFavorited = favorites.some((f) => f.id === currentMomentId);

  const allActiveOpen =
    activeLines.length > 0 &&
    activeLines.every((line) => showAllTranslations || Boolean(openLineIds[line.id]));

  const toggleActiveTranslations = () => {
    if (showAllTranslations) {
      onToggleShowAllTranslations(false);
      const next: Record<string, boolean> = { ...openLineIds };
      activeLines.forEach((l) => {
        next[l.id] = false;
      });
      setOpenLineIds(next);
      return;
    }
    const target = !allActiveOpen;
    const next: Record<string, boolean> = { ...openLineIds };
    activeLines.forEach((l) => {
      next[l.id] = target;
    });
    setOpenLineIds(next);
  };

  return (
    <section className="bg-white rounded-2xl border border-[#EBD9C4] shadow-sm overflow-hidden">
      {/* Video Container */}
      <div
        ref={playerWrapperRef}
        className="relative w-full aspect-video bg-[#1A0D10] overflow-hidden"
      >
        <div ref={playerMountRef} className="w-full h-full" />

        {embedError !== null && (
          <div className="absolute inset-0 bg-[#2B1419]/95 flex flex-col items-center justify-center p-6 text-center text-[#FFF8E7]">
            <AlertCircle className="w-10 h-10 text-[#FFD54F] mb-3" />
            <h3 className="font-display text-xl font-bold">
              El reproductor incrustado de YouTube no está disponible en este momento
            </h3>
            <p className="text-sm text-[#FFF8E7]/85 mt-2 max-w-lg">
              Puedes abrir el episodio original en YouTube mientras sigues usando la transcripción sincronizada, el vocabulario, la gramática y todos los juegos.
            </p>
            <p className="text-xs text-[#FFD54F] font-armenian mt-1.5 max-w-lg">
              Կարող եք բացել բնօրինակ տեսանյութը YouTube-ում և զուգահեռ օգտվել ամբողջական տրանսկրիպցիայից ու վարժություններից։
            </p>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E53935] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver vídeo original en YouTube
            </a>
          </div>
        )}
      </div>

      {/* Custom Player Control Bar */}
      <div className="bg-[#2B1419] text-[#FFF8E7] px-4 py-3.5 sm:px-5 space-y-3">
        {/* Progress Scrubber & Time */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-[#FFD54F] min-w-[46px]">
            {formatTime(effectiveTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(maxEpisodeDuration))}
            step={1}
            value={Math.min(Math.floor(effectiveTime), Math.floor(maxEpisodeDuration))}
            onChange={(e) => setLocalScrubTime(Number(e.target.value))}
            onMouseUp={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              setLocalScrubTime(null);
              seekToTime(val);
            }}
            onTouchEnd={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              setLocalScrubTime(null);
              seekToTime(val);
            }}
            onKeyUp={(e) => {
              const val = Number((e.target as HTMLInputElement).value);
              setLocalScrubTime(null);
              seekToTime(val);
            }}
            aria-label="Progreso del vídeo"
            className="flex-1 h-2 rounded-lg appearance-none bg-white/20 accent-[#FF9800] cursor-pointer"
          />
          <span className="text-xs font-mono tabular-nums text-[#FFF8E7]/75 min-w-[46px] text-right">
            {formatTime(maxEpisodeDuration)}
          </span>
        </div>

        {/* Transport Controls + Speed + Fullscreen */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePlay}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isPlaying
                  ? 'bg-[#FF9800] text-[#2B1419]'
                  : 'bg-[#A51C30] text-white hover:bg-[#E53935]'
              }`}
            >
              <Play className="w-4 h-4" />
              Reproducir
            </button>

            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-[#FFF8E7] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>

            <button
              type="button"
              onClick={() => seekToTime(effectiveTime - 5)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-[#FFF8E7] transition-colors cursor-pointer whitespace-nowrap"
              title="Retroceder 5 segundos"
            >
              <RotateCcw className="w-4 h-4" />
              -5 s
            </button>

            <button
              type="button"
              onClick={() => seekToTime(effectiveTime + 5)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-[#FFF8E7] transition-colors cursor-pointer whitespace-nowrap"
              title="Avanzar 5 segundos"
            >
              <RotateCw className="w-4 h-4" />
              +5 s
            </button>

            <button
              type="button"
              onClick={handleRepeatPhrase}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-[#FFD54F]/15 hover:bg-[#FFD54F]/25 text-[#FFD54F] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Repeat className="w-4 h-4" />
              Repetir frase
            </button>

            <button
              type="button"
              onClick={handleResetStart}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-[#FFF8E7] transition-colors cursor-pointer whitespace-nowrap"
            >
              <SkipBack className="w-4 h-4" />
              Volver al inicio
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg bg-white/10 p-0.5" role="group" aria-label="Velocidad de reproducción">
              {SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-2 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-[#FFD54F] text-[#2B1419]'
                      : 'text-[#FFF8E7]/80 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onToggleFavorite({
                  id: currentMomentId,
                  chapterId,
                  category: 'video',
                  es: `${chapterTitle} — Momento ${formatTime(effectiveTime)}${activeCue ? `: «${activeCue.text}»` : ''}`,
                  hy: activeCue ? activeCue.hy : `Տեսանյութի պահ՝ ${formatTime(effectiveTime)}`,
                  timestamp: Math.floor(effectiveTime),
                  timeLabel: formatTime(effectiveTime),
                })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isMomentFavorited
                  ? 'bg-[#FF9800] text-[#2B1419]'
                  : 'bg-white/10 hover:bg-white/20 text-[#FFF8E7]'
              }`}
              title="Guardar momento del vídeo en favoritos"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Guardar momento
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFF8E7] transition-colors cursor-pointer"
              title="Pantalla completa"
              aria-label="Pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Interactive Subtitle Area directly below player */}
      <div className="bg-[#FFF8E7] border-t border-[#EBD9C4] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#800020]">
            <Languages className="w-4 h-4" />
            <span>Subtítulo interactivo sincronizado · Haz clic en la frase para ver el armenio</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleActiveTranslations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#EBD9C4] text-[#800020] hover:bg-[#FFD54F]/25 transition-colors cursor-pointer whitespace-nowrap"
            >
              {allActiveOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {allActiveOpen ? 'Ocultar traducción' : 'Mostrar traducción'}
            </button>

            <button
              type="button"
              onClick={() => onToggleShowAllTranslations(!showAllTranslations)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#EBD9C4] text-[#2B1419] hover:border-[#800020] transition-colors cursor-pointer whitespace-nowrap"
            >
              {showAllTranslations ? 'Ocultar traducción completa' : 'Mostrar traducción completa'}
            </button>

            {activeCue && (
              <button
                type="button"
                onClick={() =>
                  onToggleFavorite({
                    id: activeCue.id,
                    chapterId,
                    category: 'line',
                    es: activeCue.text,
                    hy: activeCue.hy,
                    timestamp: activeCue.start,
                    timeLabel: activeCue.timeLabel,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  isCueFavorited
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-[#800020] border-[#EBD9C4] hover:border-[#800020]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {isCueFavorited ? 'En favoritos' : 'Añadir a favoritos'}
              </button>
            )}
          </div>
        </div>

        {/* Active Lines (supports multiple lines sharing identical timestamps) */}
        <div className="space-y-3">
          {activeLines.map((line) => {
            const isTranslated = showAllTranslations || Boolean(openLineIds[line.id]);
            return (
              <div
                key={line.id}
                className="bg-white rounded-xl border border-[#EBD9C4] p-4 shadow-2xs transition-colors hover:border-[#A51C30]/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLineTranslation(line.id)}
                    className="flex-1 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800020] rounded"
                  >
                    <span className="inline-block font-mono text-xs text-[#800020]/70 mr-2 tabular-nums">
                      [{line.timeLabel}]
                    </span>
                    <span className="text-lg sm:text-xl font-semibold text-[#2B1419] group-hover:text-[#A51C30] transition-colors leading-snug">
                      {line.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakSpanish(line.text)}
                    className="shrink-0 p-2 rounded-lg text-[#800020] hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                    title="Escuchar frase"
                    aria-label="Escuchar frase"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {isTranslated && (
                  <div className="mt-3 pt-3 border-t border-[#EBD9C4]/70 animate-pop-success">
                    <p className="text-base sm:text-lg text-[#800020] font-armenian font-medium leading-relaxed">
                      {line.hy}
                    </p>
                    {line.note && (
                      <p className="mt-1.5 text-xs text-[#6E4A52] italic">
                        Nota de transcripción: {line.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
