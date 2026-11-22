import React, { useEffect, useMemo, useState } from 'react';
import {
  Gamepad2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  Play,
  CheckCircle2,
  XCircle,
  Trophy,
  Star,
  Timer,
  Lightbulb,
  Users,
  Sparkles,
  BookOpen,
  MessageSquare,
  Headphones,
  Layers,
} from 'lucide-react';
import {
  ChapterGamesData,
  ChapterId,
  DetectErrorQuestion,
  DictationQuestion,
  FillBlankQuestion,
  GameProgressRecord,
  MemoryPair,
  MillionaireQuestion,
  MultipleChoiceQuestion,
  OpenSpeakingQuestion,
  OrderPhraseQuestion,
  PasapalabraEntry,
  StoryBranchPrompt,
  TranslateQuestion,
  TrueFalseQuestion,
} from './types';
import { ClickableSpanish, formatTime, normalizeText, shuffleArray, speakSpanish } from './uiHelpers';

interface GameMeta {
  id: string;
  number: number;
  title: string;
  subtitleEs: string;
  subtitleHy: string;
  totalLabel: string;
}

export const GAMES_CATALOG: GameMeta[] = [
  { id: 'game1', number: 1, title: 'Comprensión auditiva', subtitleEs: 'Escucha la frase y elige el significado correcto', subtitleHy: 'Լսիր արտահայտությունը և ընտրիր ճիշտ իմաստը', totalLabel: '20 preguntas' },
  { id: 'game2', number: 2, title: 'Completa la frase', subtitleEs: 'Elige la palabra o forma verbal que falta', subtitleHy: 'Լրացրու բաց թողնված բառը', totalLabel: '20 preguntas' },
  { id: 'game3', number: 3, title: '¿Quién lo dijo?', subtitleEs: 'Identifica qué personaje pronuncia cada réplica', subtitleHy: 'Ո՞ր հերոսն է ասել այս արտահայտությունը', totalLabel: '15 preguntas' },
  { id: 'game4', number: 4, title: 'Verdadero o falso', subtitleEs: 'Comprueba la comprensión de la trama del episodio', subtitleHy: 'Ճի՞շտ է, թե՞ սխալ սերիայի իրադարձությունների մասին', totalLabel: '20 afirmaciones' },
  { id: 'game5', number: 5, title: 'Ordena la frase', subtitleEs: 'Construye oraciones reales ordenando las palabras', subtitleHy: 'Դասավորիր բառերը ճիշտ հերթականությամբ', totalLabel: '20 frases' },
  { id: 'game6', number: 6, title: 'Memory', subtitleEs: 'Empareja tarjetas en 3 modos y 3 niveles', subtitleHy: 'Հիշողության խաղ՝ 3 ռեժիմ և 3 բարդություն', totalLabel: '3 modos' },
  { id: 'game7', number: 7, title: 'Completa el diálogo', subtitleEs: 'Elige la respuesta natural en cada escena', subtitleHy: 'Ընտրիր երկխոսության բնական շարունակությունը', totalLabel: '20 diálogos' },
  { id: 'game8', number: 8, title: 'Traduce al español', subtitleEs: 'Del armenio al español natural (acepta variantes)', subtitleHy: 'Թարգմանիր հայերենից իսպաներեն', totalLabel: '20 frases' },
  { id: 'game9', number: 9, title: 'Traduce al armenio', subtitleEs: 'Del español al armenio oriental natural', subtitleHy: 'Թարգմանիր իսպաներենից հայերեն', totalLabel: '20 frases' },
  { id: 'game10', number: 10, title: 'Detecta el error', subtitleEs: 'Encuentra y corrige el error gramatical o léxico', subtitleHy: 'Գտիր և ուղղիր սխալը նախադասության մեջ', totalLabel: '20 frases' },
  { id: 'game11', number: 11, title: 'Pasapalabra', subtitleEs: 'El rosco del alfabeto español con vocabulario del capítulo', subtitleHy: 'Իսպաներեն այբուբենի խաղ՝ սերիայի բառապաշարով', totalLabel: 'Rosco A–Z' },
  { id: 'game12', number: 12, title: 'Elige el tiempo verbal', subtitleEs: 'Presente, indefinido, imperfecto, subjuntivo e imperativo', subtitleHy: 'Ընտրիր ճիշտ բայական ժամանակաձևը', totalLabel: '25 ejercicios' },
  { id: 'game13', number: 13, title: '¿Qué significa?', subtitleEs: 'Domina los argentinismos y expresiones coloquiales', subtitleHy: 'Ի՞նչ է նշանակում արգենտինական արտահայտությունը', totalLabel: '20 expresiones' },
  { id: 'game14', number: 14, title: 'Escucha y escribe', subtitleEs: 'Dictado interactivo con audio repetible', subtitleHy: 'Լսիր և գրիր (ինտերակտիվ թելադրություն)', totalLabel: '15 frases' },
  { id: 'game15', number: 15, title: 'Responde rápido', subtitleEs: 'Desafío cronometrado con récord de velocidad', subtitleHy: 'Արագ պատասխանների մրցույթ՝ ժամանակաչափով', totalLabel: '20 preguntas' },
  { id: 'game16', number: 16, title: 'Habla español', subtitleEs: 'Práctica oral guiada con respuestas modelo y notas', subtitleHy: 'Բանավոր խոսքի վարժանք՝ օրինակելի պատասխաններով', totalLabel: '20 preguntas' },
  { id: 'game17', number: 17, title: 'Continúa la historia', subtitleEs: 'Escenas ramificadas y creación de tu propio guion', subtitleHy: 'Շարունակիր պատմությունը՝ ընտրելով կամ գրելով սցենար', totalLabel: '3 escenas' },
  { id: 'game18', number: 18, title: 'El gran concurso', subtitleEs: '30 preguntas estilo Millonario con comodines y estrellas', subtitleHy: 'Մեծ վիկտորինա՝ 30 հարց, հուշումներ և աստղեր', totalLabel: '30 preguntas' },
];

interface GamesViewProps {
  chapterId: ChapterId;
  games: ChapterGamesData;
  records: Record<string, GameProgressRecord>;
  speakingNotes: Record<string, string>;
  storyDrafts: Record<string, string>;
  onRecordResult: (
    chapterId: ChapterId,
    gameId: string,
    score: number,
    totalQuestions: number,
    extra?: { bestTimeSec?: number; stars?: number; bonusPoints?: number }
  ) => void;
  onResetGame: (chapterId: ChapterId, gameId: string) => void;
  onSaveSpeakingNote: (chapterId: ChapterId, questionId: string, text: string) => void;
  onSaveStoryDraft: (chapterId: ChapterId, sceneId: string, text: string) => void;
  onJumpToVideo: (chapterId: ChapterId, seconds: number) => void;
}

// Helper for shuffling MCQ options while preserving correct identity
interface ShuffledOption {
  es: string;
  hy: string;
  isCorrect: boolean;
}

function buildShuffledMcqOptions(q: MultipleChoiceQuestion): ShuffledOption[] {
  return shuffleArray(
    q.options.map((opt, idx) => ({
      es: opt.es,
      hy: opt.hy,
      isCorrect: idx === q.correctIndex,
    }))
  );
}

/* ============================================================================
   REUSABLE END SCREEN
   ============================================================================ */
const GameResultBanner: React.FC<{
  title: string;
  correct: number;
  wrong: number;
  total: number;
  elapsedSec?: number;
  extraPoints?: number;
  onReplay: () => void;
  onBack: () => void;
}> = ({ title, correct, wrong, total, elapsedSec, extraPoints, onReplay, onBack }) => {
  const ratio = total > 0 ? correct / total : 0;
  const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : correct > 0 ? 1 : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#FFD54F] p-6 sm:p-8 text-center space-y-5 shadow-sm animate-pop-success">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF8E7] text-[#FF9800] border border-[#FFD54F]">
        <Trophy className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#800020]">{title}</h3>
        <p className="text-sm text-[#6E4A52] font-armenian mt-1">
          Արդյունքը պահպանված է քո առաջընթացում։
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            className={`w-7 h-7 ${n <= stars ? 'text-[#FF9800]' : 'text-[#EBD9C4]'}`}
            fill={n <= stars ? 'currentColor' : 'none'}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-3">
          <span className="block text-xs text-[#6E4A52]">Correctas</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">{correct}</span>
        </div>
        <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-3">
          <span className="block text-xs text-[#6E4A52]">Incorrectas</span>
          <span className="text-xl font-bold text-[#E53935] tabular-nums">{wrong}</span>
        </div>
        <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-3">
          <span className="block text-xs text-[#6E4A52]">Precisión</span>
          <span className="text-xl font-bold text-[#800020] tabular-nums">
            {Math.round(ratio * 100)}%
          </span>
        </div>
        <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-3">
          <span className="block text-xs text-[#6E4A52]">
            {elapsedSec !== undefined ? 'Tiempo' : 'Puntos'}
          </span>
          <span className="text-xl font-bold text-[#2B1419] tabular-nums">
            {elapsedSec !== undefined
              ? formatTime(elapsedSec)
              : `+${correct * 10 + (extraPoints ?? 0)}`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Volver a jugar
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] text-[#2B1419] font-semibold text-sm hover:border-[#800020] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver todos los juegos
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
   1. MULTIPLE CHOICE ENGINE (Games 1, 3, 7, 12, 13, 15)
   ============================================================================ */
const MultipleChoiceGame: React.FC<{
  gameId: string;
  title: string;
  chapterId: ChapterId;
  questions: MultipleChoiceQuestion[];
  mode: 'listening' | 'who' | 'dialogue' | 'verb' | 'meaning' | 'speed';
  onFinish: (score: number, total: number, elapsedSec?: number) => void;
  onBack: () => void;
  onJumpToVideo: (chapterId: ChapterId, sec: number) => void;
}> = ({ title, chapterId, questions, mode, onFinish, onBack, onJumpToVideo }) => {
  const [deck, setDeck] = useState<MultipleChoiceQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState<ShuffledOption[]>(() =>
    deck[0] ? buildShuffledMcqOptions(deck[0]) : []
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (mode !== 'speed' || done) return;
    const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [mode, done]);

  const current = deck[idx];

  const handleReplay = () => {
    const fresh = shuffleArray(questions);
    setDeck(fresh);
    setIdx(0);
    setOptions(fresh[0] ? buildShuffledMcqOptions(fresh[0]) : []);
    setSelectedIdx(null);
    setCorrect(0);
    setWrong(0);
    setDone(false);
    setElapsedSec(0);
  };

  const handleChoose = (optIdx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(optIdx);
    const ok = options[optIdx]?.isCorrect;
    if (ok) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length, mode === 'speed' ? elapsedSec : undefined);
    } else {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      setOptions(buildShuffledMcqOptions(deck[nextIdx]));
      setSelectedIdx(null);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title={title}
        correct={correct}
        wrong={wrong}
        total={deck.length}
        elapsedSec={mode === 'speed' ? elapsedSec : undefined}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#6E4A52]">
        <span className="tabular-nums">
          Pregunta {idx + 1} / {deck.length}
        </span>
        <div className="flex items-center gap-4 tabular-nums">
          <span className="text-emerald-700">Correctas: {correct}</span>
          <span className="text-[#E53935]">Incorrectas: {wrong}</span>
          {mode === 'speed' && (
            <span className="inline-flex items-center gap-1 text-[#800020] font-mono">
              <Timer className="w-3.5 h-3.5" />
              {formatTime(elapsedSec)}
            </span>
          )}
        </div>
      </div>

      {/* Prompt area */}
      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4 sm:p-5 space-y-3">
        {mode === 'listening' && (
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => speakSpanish(current.quoteEs || current.questionEs, 0.9)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#800020] text-white text-sm font-semibold hover:bg-[#A51C30] transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              Escuchar frase
            </button>
            <button
              type="button"
              onClick={() => speakSpanish(current.quoteEs || current.questionEs, 0.72)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#EBD9C4] text-xs font-semibold text-[#800020] hover:border-[#800020] cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Más lento
            </button>
            {current.timestamp !== undefined && (
              <button
                type="button"
                onClick={() => onJumpToVideo(chapterId, current.timestamp!)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#EBD9C4] text-xs font-mono text-[#800020] hover:border-[#800020] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Escena {current.timeLabel}
              </button>
            )}
          </div>
        )}

        {current.quoteEs && (
          <div className="bg-white rounded-xl border border-[#EBD9C4] p-3.5">
            <ClickableSpanish
              es={`«${current.quoteEs}»`}
              hy={current.quoteHy || current.questionHy}
              withAudio
              className="text-base sm:text-lg font-semibold text-[#800020] italic"
            />
          </div>
        )}

        <ClickableSpanish
          es={current.questionEs}
          hy={current.questionHy}
          withAudio={mode !== 'listening'}
          className="text-lg sm:text-xl font-bold text-[#2B1419]"
        />
      </div>

      {/* Shuffled Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          let cls = 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020] hover:bg-[#FFF8E7]/50';
          if (selectedIdx !== null) {
            if (opt.isCorrect) {
              cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
            } else if (i === selectedIdx) {
              cls = 'bg-red-50 border-[#E53935] text-[#A51C30]';
            } else {
              cls = 'bg-white/60 border-[#EBD9C4] text-[#6E4A52] opacity-70';
            }
          }

          return (
            <div
              key={`${idx}-${i}`}
              className={`rounded-xl border p-3.5 transition-colors flex flex-col justify-between gap-2 ${cls}`}
            >
              <button
                type="button"
                onClick={() => handleChoose(i)}
                disabled={selectedIdx !== null}
                className="text-left w-full text-sm sm:text-base cursor-pointer disabled:cursor-default"
              >
                <span className="font-mono text-xs text-[#800020] mr-2 font-bold">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt.es}
              </button>
              {opt.hy && (
                <div className="pt-1 border-t border-black/5">
                  <ClickableSpanish
                    es="Ver traducción al armenio"
                    hy={opt.hy}
                    showHintIcon={false}
                    className="text-[11px] font-semibold text-[#800020]/75 hover:text-[#800020]"
                    hyClassName="text-xs text-[#800020] font-armenian mt-1"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {selectedIdx !== null && (
        <div
          className={`rounded-xl p-4 border animate-pop-success flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            options[selectedIdx]?.isCorrect
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              {options[selectedIdx]?.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-900">¡Respuesta correcta!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-[#E53935]" />
                  <span className="text-[#A51C30]">
                    Correcto: {options.find((o) => o.isCorrect)?.es}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-[#2B1419] font-armenian">{current.explanationHy}</p>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer shrink-0"
          >
            {idx + 1 >= deck.length ? 'Ver resultado' : 'Siguiente'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   2. FILL IN THE BLANK (Game 2)
   ============================================================================ */
const FillBlankGame: React.FC<{
  questions: FillBlankQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ questions, onFinish, onBack }) => {
  const [deck, setDeck] = useState<FillBlankQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [opts, setOpts] = useState<string[]>(() => (deck[0] ? shuffleArray(deck[0].options) : []));
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const handleReplay = () => {
    const fresh = shuffleArray(questions);
    setDeck(fresh);
    setIdx(0);
    setOpts(fresh[0] ? shuffleArray(fresh[0].options) : []);
    setPicked(null);
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const handlePick = (val: string) => {
    if (picked !== null || !cur) return;
    setPicked(val);
    if (val === cur.correctAnswer) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      const n = idx + 1;
      setIdx(n);
      setOpts(shuffleArray(deck[n].options));
      setPicked(null);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="Completa la frase"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  const isCorrect = picked === cur.correctAnswer;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Frase {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-2">
        <p className="text-lg sm:text-xl font-bold text-[#2B1419] leading-relaxed">
          {cur.sentenceBefore}{' '}
          <span className="inline-block px-3 py-0.5 mx-1 rounded-lg bg-white border-2 border-dashed border-[#800020] text-[#800020]">
            {picked ?? '_____'}
          </span>{' '}
          {cur.sentenceAfter}
        </p>
        <ClickableSpanish
          es="Haz clic aquí para ver la traducción al armenio"
          hy={cur.fullHy}
          className="text-xs font-semibold text-[#800020]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          let style = 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020]';
          if (picked !== null) {
            if (o === cur.correctAnswer) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
            else if (o === picked) style = 'bg-red-50 border-[#E53935] text-[#A51C30]';
            else style = 'bg-white/60 border-[#EBD9C4] opacity-65';
          }
          return (
            <button
              key={o}
              type="button"
              onClick={() => handlePick(o)}
              disabled={picked !== null}
              className={`px-4 py-3 rounded-xl border text-base font-medium transition-colors cursor-pointer disabled:cursor-default ${style}`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`rounded-xl p-4 border animate-pop-success flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#2B1419]">
              {isCorrect ? '¡Correcto!' : `Forma correcta: ${cur.fullEs}`}
            </p>
            <p className="text-sm font-armenian text-[#800020]">{cur.explanationHy}</p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] cursor-pointer shrink-0"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   3. TRUE OR FALSE (Game 4)
   ============================================================================ */
const TrueFalseGame: React.FC<{
  questions: TrueFalseQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ questions, onFinish, onBack }) => {
  const [deck, setDeck] = useState<TrueFalseQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const handleReplay = () => {
    setDeck(shuffleArray(questions));
    setIdx(0);
    setPicked(null);
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const handleAnswer = (val: boolean) => {
    if (picked !== null || !cur) return;
    setPicked(val);
    if (val === cur.isTrue) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="Verdadero o falso"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  const isCorrect = picked === cur.isTrue;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Afirmación {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5">
        <ClickableSpanish
          es={cur.statementEs}
          hy={cur.statementHy}
          withAudio
          className="text-lg sm:text-xl font-bold text-[#2B1419]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Verdadero', value: true },
          { label: 'Falso', value: false },
        ].map((btn) => {
          let cls = 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020]';
          if (picked !== null) {
            if (btn.value === cur.isTrue) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
            else if (btn.value === picked) cls = 'bg-red-50 border-[#E53935] text-[#A51C30]';
            else cls = 'bg-white/60 border-[#EBD9C4] opacity-65';
          }
          return (
            <button
              key={btn.label}
              type="button"
              onClick={() => handleAnswer(btn.value)}
              disabled={picked !== null}
              className={`py-4 px-5 rounded-xl border text-base sm:text-lg font-semibold transition-colors cursor-pointer disabled:cursor-default ${cls}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`rounded-xl p-4 border animate-pop-success flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="space-y-1">
            <p className="text-sm font-bold">
              {isCorrect ? '¡Correcto!' : `Es ${cur.isTrue ? 'Verdadero' : 'Falso'}.`}
            </p>
            <p className="text-sm font-armenian text-[#2B1419]">{cur.explanationHy}</p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] cursor-pointer shrink-0"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   4. ORDER THE PHRASE (Game 5)
   ============================================================================ */
const OrderPhraseGame: React.FC<{
  questions: OrderPhraseQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ questions, onFinish, onBack }) => {
  const [deck, setDeck] = useState<OrderPhraseQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [bank, setBank] = useState<{ key: string; word: string }[]>(() =>
    deck[0] ? shuffleArray(deck[0].correctOrder.map((w, i) => ({ key: `0-${i}-${w}`, word: w }))) : []
  );
  const [chosen, setChosen] = useState<{ key: string; word: string }[]>([]);
  const [checked, setChecked] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const loadQuestion = (q: OrderPhraseQuestion, qIdx: number) => {
    setBank(shuffleArray(q.correctOrder.map((w, i) => ({ key: `${qIdx}-${i}-${w}`, word: w }))));
    setChosen([]);
    setChecked('idle');
  };

  const handleReplay = () => {
    const fresh = shuffleArray(questions);
    setDeck(fresh);
    setIdx(0);
    if (fresh[0]) loadQuestion(fresh[0], 0);
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const moveFromBank = (item: { key: string; word: string }) => {
    if (checked !== 'idle') return;
    setBank((b) => b.filter((x) => x.key !== item.key));
    setChosen((c) => [...c, item]);
  };

  const moveBackToBank = (item: { key: string; word: string }) => {
    if (checked !== 'idle') return;
    setChosen((c) => c.filter((x) => x.key !== item.key));
    setBank((b) => [...b, item]);
  };

  const handleCheck = () => {
    if (!cur || checked !== 'idle') return;
    const built = normalizeText(chosen.map((c) => c.word).join(' '));
    const expected = normalizeText(cur.correctOrder.join(' '));
    if (built === expected) {
      setChecked('correct');
      setCorrect((c) => c + 1);
    } else {
      setChecked('wrong');
      setWrong((w) => w + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      const n = idx + 1;
      setIdx(n);
      loadQuestion(deck[n], n);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="Ordena la frase"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Frase {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#800020] block mb-1">
          Significado en armenio
        </span>
        <p className="text-base sm:text-lg font-armenian font-semibold text-[#2B1419]">{cur.hy}</p>
      </div>

      {/* Sentence construction area */}
      <div className="min-h-[68px] rounded-xl border-2 border-dashed border-[#EBD9C4] bg-[#FFF8E7]/40 p-3 flex flex-wrap gap-2 items-center">
        {chosen.length === 0 ? (
          <span className="text-sm text-[#6E4A52]">
            Haz clic en las palabras de abajo para construir la oración en orden...
          </span>
        ) : (
          chosen.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => moveBackToBank(item)}
              className="px-3.5 py-2 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] cursor-pointer"
            >
              {item.word}
            </button>
          ))
        )}
      </div>

      {/* Word Bank */}
      <div className="flex flex-wrap gap-2">
        {bank.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => moveFromBank(item)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#EBD9C4] text-[#2B1419] font-semibold text-sm hover:border-[#800020] hover:bg-[#FFF8E7] cursor-pointer"
          >
            {item.word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {checked === 'idle' ? (
          <>
            <button
              type="button"
              onClick={handleCheck}
              disabled={bank.length > 0}
              className="px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] disabled:opacity-45 cursor-pointer"
            >
              Comprobar orden
            </button>
            <button
              type="button"
              onClick={() => loadQuestion(cur, idx)}
              className="px-4 py-2.5 rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] text-sm font-semibold text-[#2B1419] cursor-pointer"
            >
              Limpiar
            </button>
          </>
        ) : (
          <div className={`w-full rounded-xl p-4 border animate-pop-success flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${checked === 'correct' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#2B1419]">
                {checked === 'correct'
                  ? '¡Excelente orden!'
                  : `Orden correcto: ${cur.correctOrder.join(' ')}`}
              </p>
              <p className="text-sm font-armenian text-[#800020]">{cur.explanationHy}</p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm cursor-pointer shrink-0"
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   5. MEMORY GAME (Game 6: 3 modes x 3 difficulty levels)
   ============================================================================ */
interface MemoryCardTile {
  uid: string;
  pairId: string;
  label: string;
  side: 'left' | 'right';
}

const MemoryGame: React.FC<{
  pairs: MemoryPair[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ pairs, onFinish, onBack }) => {
  const [mode, setMode] = useState<'es-hy' | 'phrase-meaning' | 'slang-neutral'>('es-hy');
  const [level, setLevel] = useState<'facil' | 'medio' | 'dificil'>('facil');

  const pairCountForLevel = level === 'facil' ? 4 : level === 'medio' ? 6 : 8;

  const buildDeck = (m: typeof mode, count: number): MemoryCardTile[] => {
    const modePairs = pairs.filter((p) => p.mode === m);
    const fallbackPool = modePairs.length >= count ? modePairs : [...modePairs, ...pairs.filter((p) => p.mode !== m)];
    const chosen = shuffleArray(fallbackPool).slice(0, Math.min(count, fallbackPool.length));
    const tiles: MemoryCardTile[] = [];
    chosen.forEach((p) => {
      tiles.push({ uid: `${p.id}-L`, pairId: p.id, label: p.left, side: 'left' });
      tiles.push({ uid: `${p.id}-R`, pairId: p.id, label: p.right, side: 'right' });
    });
    return shuffleArray(tiles);
  };

  const [tiles, setTiles] = useState<MemoryCardTile[]>(() => buildDeck('es-hy', 4));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const startBoard = (m: typeof mode, lvl: typeof level) => {
    setMode(m);
    setLevel(lvl);
    const cnt = lvl === 'facil' ? 4 : lvl === 'medio' ? 6 : 8;
    setTiles(buildDeck(m, cnt));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setCompleted(false);
  };

  const handleTileClick = (tile: MemoryCardTile) => {
    if (flipped.length === 2 || flipped.includes(tile.uid) || matched.includes(tile.pairId)) return;
    const nextFlipped = [...flipped, tile.uid];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = nextFlipped;
      const first = tiles.find((t) => t.uid === firstId);
      const second = tiles.find((t) => t.uid === secondId);
      if (first && second && first.pairId === second.pairId) {
        const nextMatched = [...matched, first.pairId];
        setMatched(nextMatched);
        setFlipped([]);
        const totalPairs = tiles.length / 2;
        if (nextMatched.length >= totalPairs) {
          setCompleted(true);
          onFinish(totalPairs, totalPairs);
        }
      } else {
        window.setTimeout(() => setFlipped([]), 850);
      }
    }
  };

  const totalPairs = tiles.length / 2;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'es-hy', label: 'Español – Armenio' },
            { id: 'phrase-meaning', label: 'Frase – Significado' },
            { id: 'slang-neutral', label: 'Coloquial – Neutro' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => startBoard(m.id as typeof mode, level)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                mode === m.id
                  ? 'bg-[#800020] text-white border-[#800020]'
                  : 'bg-white text-[#2B1419] border-[#EBD9C4]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'facil', label: 'Fácil (4 parejas)' },
            { id: 'medio', label: 'Medio (6 parejas)' },
            { id: 'dificil', label: 'Difícil (8 parejas)' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => startBoard(mode, l.id as typeof level)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                level === l.id
                  ? 'bg-[#FF9800] text-[#2B1419] border-[#FF9800]'
                  : 'bg-[#FFF8E7] text-[#2B1419] border-[#EBD9C4]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Parejas encontradas: {matched.length} / {totalPairs}</span>
        <span>Intentos: {moves} · Nivel: {pairCountForLevel} parejas</span>
      </div>

      {completed ? (
        <GameResultBanner
          title="¡Memory completado!"
          correct={totalPairs}
          wrong={Math.max(0, moves - totalPairs)}
          total={totalPairs}
          onReplay={() => startBoard(mode, level)}
          onBack={onBack}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map((tile) => {
            const isUp = flipped.includes(tile.uid) || matched.includes(tile.pairId);
            const isSolved = matched.includes(tile.pairId);
            return (
              <button
                key={tile.uid}
                type="button"
                onClick={() => handleTileClick(tile)}
                className={`min-h-[96px] p-3 rounded-xl border text-center flex items-center justify-center transition-all cursor-pointer ${
                  isSolved
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                    : isUp
                      ? 'bg-[#FFF8E7] border-[#800020] text-[#2B1419] font-semibold'
                      : 'bg-[#800020] border-[#800020] text-[#FFD54F] hover:bg-[#A51C30]'
                }`}
              >
                {isUp ? (
                  <span className="text-xs sm:text-sm leading-snug font-armenian">{tile.label}</span>
                ) : (
                  <Layers className="w-6 h-6 opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   6. TRANSLATE GAMES (Games 8 & 9)
   ============================================================================ */
const TranslateGame: React.FC<{
  title: string;
  direction: 'to-es' | 'to-hy';
  questions: TranslateQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ title, direction, questions, onFinish, onBack }) => {
  const [deck, setDeck] = useState<TranslateQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const handleReplay = () => {
    setDeck(shuffleArray(questions));
    setIdx(0);
    setAnswer('');
    setStatus('idle');
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur || status !== 'idle' || !answer.trim()) return;
    const norm = normalizeText(answer);
    const ok = cur.acceptedAnswers.some((a) => {
      const target = normalizeText(a);
      return target === norm || (norm.length > 4 && (target.includes(norm) || norm.includes(target)));
    });
    if (ok) {
      setStatus('correct');
      setCorrect((c) => c + 1);
    } else {
      setStatus('wrong');
      setWrong((w) => w + 1);
    }
  };

  const handleMarkSelfCorrect = () => {
    if (status === 'wrong') {
      setStatus('correct');
      setWrong((w) => Math.max(0, w - 1));
      setCorrect((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      setIdx((i) => i + 1);
      setAnswer('');
      setStatus('idle');
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title={title}
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Frase {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#800020]">
          {direction === 'to-es' ? 'Traduce al español' : 'Traduce al armenio oriental'}
        </span>
        {direction === 'to-hy' ? (
          <ClickableSpanish
            es={cur.sourceText}
            hy={cur.displayAnswer}
            withAudio
            className="text-lg sm:text-xl font-bold text-[#2B1419]"
          />
        ) : (
          <p className="text-lg sm:text-xl font-bold text-[#2B1419] font-armenian">
            {cur.sourceText}
          </p>
        )}
      </div>

      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={status !== 'idle'}
          placeholder={
            direction === 'to-es'
              ? 'Escribe tu traducción en español...'
              : 'Գրիր թարգմանությունը հայերեն...'
          }
          className="flex-1 px-4 py-3 rounded-xl border border-[#EBD9C4] text-base text-[#2B1419] font-armenian focus:outline-none focus:border-[#800020]"
        />
        {status === 'idle' ? (
          <button
            type="submit"
            disabled={!answer.trim()}
            className="px-6 py-3 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] disabled:opacity-45 cursor-pointer"
          >
            Comprobar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-[#FF9800] text-[#2B1419] font-bold text-sm cursor-pointer"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </form>

      {status !== 'idle' && (
        <div className={`rounded-xl p-4 border animate-pop-success space-y-2 ${status === 'correct' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-bold text-[#2B1419]">
            {status === 'correct' ? '¡Muy bien!' : `Traducción modelo: ${cur.displayAnswer}`}
          </p>
          <p className="text-sm font-armenian text-[#800020]">{cur.explanationHy}</p>
          {status === 'wrong' && (
            <button
              type="button"
              onClick={handleMarkSelfCorrect}
              className="text-xs font-semibold text-[#800020] underline cursor-pointer"
            >
              Mi variante tiene el mismo sentido — contar como válida
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   7. DETECT THE ERROR (Game 10)
   ============================================================================ */
const DetectErrorGame: React.FC<{
  questions: DetectErrorQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ questions, onFinish, onBack }) => {
  const [deck, setDeck] = useState<DetectErrorQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [opts, setOpts] = useState<string[]>(() => (deck[0] ? shuffleArray(deck[0].options) : []));
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const handleReplay = () => {
    const fresh = shuffleArray(questions);
    setDeck(fresh);
    setIdx(0);
    setOpts(fresh[0] ? shuffleArray(fresh[0].options) : []);
    setPicked(null);
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const handlePick = (opt: string) => {
    if (picked !== null || !cur) return;
    setPicked(opt);
    if (opt === cur.correctWord) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      const n = idx + 1;
      setIdx(n);
      setOpts(shuffleArray(deck[n].options));
      setPicked(null);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="Detecta el error"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Frase {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#E53935]">
          Esta frase contiene un error ({cur.wrongWord}) · Elige la corrección adecuada
        </span>
        <ClickableSpanish
          es={cur.wrongEs}
          hy={cur.hy}
          className="text-lg sm:text-xl font-bold text-[#2B1419]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opts.map((o) => {
          let cls = 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020]';
          if (picked !== null) {
            if (o === cur.correctWord) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
            else if (o === picked) cls = 'bg-red-50 border-[#E53935] text-[#A51C30]';
            else cls = 'bg-white/60 border-[#EBD9C4] opacity-65';
          }
          return (
            <button
              key={o}
              type="button"
              onClick={() => handlePick(o)}
              disabled={picked !== null}
              className={`px-4 py-3 rounded-xl border text-base font-medium cursor-pointer disabled:cursor-default ${cls}`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`rounded-xl p-4 border animate-pop-success flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${picked === cur.correctWord ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#2B1419]">Frase correcta: {cur.correctEs}</p>
            <p className="text-sm font-armenian text-[#800020]">{cur.explanationHy}</p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm cursor-pointer shrink-0"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   8. PASAPALABRA (Game 11)
   ============================================================================ */
const PasapalabraGame: React.FC<{
  entries: PasapalabraEntry[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ entries, onFinish, onBack }) => {
  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'passed' | 'correct' | 'wrong'>>(() => {
    const map: Record<string, 'pending'> = {};
    entries.forEach((e) => {
      map[e.letter] = 'pending';
    });
    return map;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const cur = entries[currentIdx];

  const findNextUnresolved = (
    nextStatuses: Record<string, 'pending' | 'passed' | 'correct' | 'wrong'>,
    fromIdx: number
  ): number => {
    for (let step = 1; step <= entries.length; step++) {
      const candidate = (fromIdx + step) % entries.length;
      const st = nextStatuses[entries[candidate].letter];
      if (st === 'pending' || st === 'passed') return candidate;
    }
    return -1;
  };

  const handleRestart = () => {
    const map: Record<string, 'pending'> = {};
    entries.forEach((e) => {
      map[e.letter] = 'pending';
    });
    setStatuses(map);
    setCurrentIdx(0);
    setInput('');
    setLastFeedback(null);
    setDone(false);
  };

  const advance = (nextStatuses: Record<string, 'pending' | 'passed' | 'correct' | 'wrong'>) => {
    const nextIdx = findNextUnresolved(nextStatuses, currentIdx);
    if (nextIdx === -1) {
      const okCount = Object.values(nextStatuses).filter((s) => s === 'correct').length;
      setDone(true);
      onFinish(okCount, entries.length);
    } else {
      setCurrentIdx(nextIdx);
      setInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur || !input.trim()) return;
    const isOk = normalizeText(input) === normalizeText(cur.answer);
    const nextStatuses = {
      ...statuses,
      [cur.letter]: isOk ? ('correct' as const) : ('wrong' as const),
    };
    setStatuses(nextStatuses);
    setLastFeedback(
      isOk
        ? `¡Correcto! (${cur.letter}: ${cur.answer})`
        : `Incorrecto en la ${cur.letter}. Respuesta: ${cur.answer}`
    );
    advance(nextStatuses);
  };

  const handlePass = () => {
    if (!cur) return;
    const nextStatuses = { ...statuses, [cur.letter]: 'passed' as const };
    setStatuses(nextStatuses);
    setLastFeedback(`Pasapalabra en la letra ${cur.letter}. Volveremos después.`);
    advance(nextStatuses);
  };

  const correctCount = Object.values(statuses).filter((s) => s === 'correct').length;
  const wrongCount = Object.values(statuses).filter((s) => s === 'wrong').length;

  if (done) {
    return (
      <GameResultBanner
        title="Pasapalabra completado"
        correct={correctCount}
        wrong={wrongCount}
        total={entries.length}
        onReplay={handleRestart}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Rosco del capítulo ({entries.length} letras)</span>
        <span>Aciertos: {correctCount} · Fallos: {wrongCount}</span>
      </div>

      {/* Rosco Letter Grid */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {entries.map((entry, idx) => {
          const st = statuses[entry.letter];
          const isCurrent = idx === currentIdx;
          let color = 'bg-[#FFF8E7] text-[#2B1419] border-[#EBD9C4]';
          if (st === 'correct') color = 'bg-emerald-600 text-white border-emerald-600';
          else if (st === 'wrong') color = 'bg-[#E53935] text-white border-[#E53935]';
          else if (st === 'passed') color = 'bg-[#FFD54F] text-[#2B1419] border-[#FF9800]';
          if (isCurrent) color += ' ring-2 ring-[#800020] ring-offset-2 scale-105';

          return (
            <button
              key={entry.letter}
              type="button"
              onClick={() => {
                if (st === 'pending' || st === 'passed') setCurrentIdx(idx);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${color}`}
            >
              {entry.letter}
            </button>
          );
        })}
      </div>

      {/* Active Letter Clue */}
      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
          <span>
            {cur.containsMode ? `Contiene la letra ${cur.letter}` : `Empieza por la letra ${cur.letter}`}
          </span>
        </div>
        <ClickableSpanish
          es={cur.definitionEs}
          hy={cur.definitionHy}
          withAudio
          className="text-lg sm:text-xl font-bold text-[#2B1419]"
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Escribe la palabra con «${cur.letter}»...`}
          className="flex-1 px-4 py-3 rounded-xl border border-[#EBD9C4] text-base text-[#2B1419] focus:outline-none focus:border-[#800020]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-5 py-3 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] disabled:opacity-45 cursor-pointer"
        >
          Responder
        </button>
        <button
          type="button"
          onClick={handlePass}
          className="px-5 py-3 rounded-xl bg-[#FFD54F] text-[#2B1419] font-bold text-sm hover:bg-[#FF9800] cursor-pointer"
        >
          Pasapalabra
        </button>
      </form>

      {lastFeedback && (
        <p className="text-sm font-medium text-[#800020] bg-[#FFF8E7] border border-[#EBD9C4] rounded-xl px-4 py-2.5">
          {lastFeedback}
        </p>
      )}
    </div>
  );
};

/* ============================================================================
   9. DICTATION (Game 14)
   ============================================================================ */
const DictationGame: React.FC<{
  chapterId: ChapterId;
  questions: DictationQuestion[];
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
  onJumpToVideo: (chapterId: ChapterId, sec: number) => void;
}> = ({ chapterId, questions, onFinish, onBack, onJumpToVideo }) => {
  const [deck, setDeck] = useState<DictationQuestion[]>(() => shuffleArray(questions));
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const cur = deck[idx];

  const handleReplay = () => {
    setDeck(shuffleArray(questions));
    setIdx(0);
    setTyped('');
    setStatus('idle');
    setCorrect(0);
    setWrong(0);
    setDone(false);
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur || status !== 'idle' || !typed.trim()) return;
    const isOk = normalizeText(typed) === normalizeText(cur.textEs);
    if (isOk) {
      setStatus('correct');
      setCorrect((c) => c + 1);
    } else {
      setStatus('wrong');
      setWrong((w) => w + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
      onFinish(correct, deck.length);
    } else {
      setIdx((i) => i + 1);
      setTyped('');
      setStatus('idle');
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="Escucha y escribe"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Dictado {idx + 1} / {deck.length}</span>
        <span>Correctas: {correct} · Incorrectas: {wrong}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => speakSpanish(cur.textEs, 0.92)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            Escuchar frase
          </button>
          <button
            type="button"
            onClick={() => speakSpanish(cur.textEs, 0.72)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#EBD9C4] text-xs font-semibold text-[#800020] cursor-pointer"
          >
            Velocidad lenta (0.7x)
          </button>
          <button
            type="button"
            onClick={() => onJumpToVideo(chapterId, cur.timestamp)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#EBD9C4] text-xs font-mono text-[#800020] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Ver escena {cur.timeLabel}
          </button>
        </div>

        <ClickableSpanish
          es="Necesito una pista en armenio"
          hy={cur.hy}
          className="text-xs font-semibold text-[#800020]"
        />
      </div>

      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={status !== 'idle'}
          placeholder="Escribe exactamente lo que escuchas en español..."
          className="flex-1 px-4 py-3 rounded-xl border border-[#EBD9C4] text-base text-[#2B1419] focus:outline-none focus:border-[#800020]"
        />
        {status === 'idle' ? (
          <button
            type="submit"
            disabled={!typed.trim()}
            className="px-6 py-3 rounded-xl bg-[#800020] text-white font-semibold text-sm disabled:opacity-45 cursor-pointer"
          >
            Comprobar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-[#FF9800] text-[#2B1419] font-bold text-sm cursor-pointer"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </form>

      {status !== 'idle' && (
        <div className={`rounded-xl p-4 border animate-pop-success space-y-1.5 ${status === 'correct' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm font-bold text-[#2B1419]">
            {status === 'correct' ? '¡Dictado perfecto!' : `Texto original: ${cur.textEs}`}
          </p>
          <p className="text-sm font-armenian text-[#800020]">{cur.hy}</p>
          <p className="text-xs font-armenian text-[#6E4A52]">{cur.explanationHy}</p>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   10. SPEAK SPANISH (Game 16)
   ============================================================================ */
const SpeakSpanishGame: React.FC<{
  chapterId: ChapterId;
  questions: OpenSpeakingQuestion[];
  savedNotes: Record<string, string>;
  onSaveNote: (chapterId: ChapterId, qId: string, text: string) => void;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
}> = ({ chapterId, questions, savedNotes, onSaveNote, onFinish, onBack }) => {
  const [idx, setIdx] = useState(0);
  const [showModel, setShowModel] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(Object.keys(savedNotes)));

  const cur = questions[idx];
  if (!cur) return null;

  const noteVal = savedNotes[cur.id] ?? '';

  const markPracticed = () => {
    const next = new Set(completedIds);
    next.add(cur.id);
    setCompletedIds(next);
    onFinish(next.size, questions.length);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#6E4A52] tabular-nums">
        <span>Pregunta oral {idx + 1} / {questions.length}</span>
        <span>Practicadas: {completedIds.size} / {questions.length}</span>
      </div>

      <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
          <MessageSquare className="w-4 h-4" />
          <span>Responde en voz alta y escribe tus ideas en español</span>
        </div>
        <ClickableSpanish
          es={cur.questionEs}
          hy={cur.questionHy}
          withAudio
          className="text-lg sm:text-xl font-bold text-[#2B1419]"
        />
      </div>

      {/* Useful phrases */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
          Frases útiles para tu respuesta (haz clic para ver el armenio)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cur.usefulPhrases.map((p, i) => (
            <div key={i} className="rounded-xl border border-[#EBD9C4] p-3 bg-[#FFF8E7]/40">
              <ClickableSpanish es={p.es} hy={p.hy} withAudio className="text-sm font-semibold text-[#800020]" />
            </div>
          ))}
        </div>
      </div>

      {/* Student notes textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
          Tu respuesta escrita / borrador para hablar
        </label>
        <textarea
          rows={3}
          value={noteVal}
          onChange={(e) => onSaveNote(chapterId, cur.id, e.target.value)}
          placeholder="Escribe tu respuesta en español para practicarla en voz alta..."
          className="w-full rounded-xl border border-[#EBD9C4] p-3.5 text-sm text-[#2B1419] focus:outline-none focus:border-[#800020]"
        />
      </div>

      {/* Model answer */}
      <div>
        <button
          type="button"
          onClick={() => setShowModel((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#800020] hover:underline cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          {showModel ? 'Ocultar ejemplo de respuesta' : 'Ver ejemplo de respuesta modelo'}
        </button>

        {showModel && (
          <div className="mt-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-1.5 animate-pop-success">
            <ClickableSpanish
              es={cur.modelAnswerEs}
              hy={cur.modelAnswerHy}
              defaultOpen
              withAudio
              className="text-sm sm:text-base font-medium text-[#2B1419]"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBD9C4]/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => {
              setIdx((i) => Math.max(0, i - 1));
              setShowModel(false);
            }}
            className="px-4 py-2 rounded-xl border border-[#EBD9C4] text-sm font-semibold text-[#2B1419] disabled:opacity-40 cursor-pointer"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={idx + 1 >= questions.length}
            onClick={() => {
              setIdx((i) => Math.min(questions.length - 1, i + 1));
              setShowModel(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] text-sm font-semibold text-[#800020] disabled:opacity-40 cursor-pointer"
          >
            Siguiente
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markPracticed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#800020] text-white text-sm font-semibold hover:bg-[#A51C30] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como practicada
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl border border-[#EBD9C4] text-sm font-semibold text-[#6E4A52] cursor-pointer"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   11. CONTINUE THE STORY (Game 17)
   ============================================================================ */
const ContinueStoryGame: React.FC<{
  chapterId: ChapterId;
  scenes: StoryBranchPrompt[];
  savedDrafts: Record<string, string>;
  onSaveDraft: (chapterId: ChapterId, sceneId: string, text: string) => void;
  onFinish: (score: number, total: number) => void;
}> = ({ chapterId, scenes, savedDrafts, onSaveDraft, onFinish }) => {
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});

  const handleChooseBranch = (sceneId: string, branchId: string) => {
    const next = { ...selectedBranches, [sceneId]: branchId };
    setSelectedBranches(next);
    onFinish(Object.keys(next).length, scenes.length);
  };

  return (
    <div className="space-y-5">
      {scenes.map((scene, idx) => {
        const pickedId = selectedBranches[scene.id];
        const pickedBranch = scene.branches.find((b) => b.id === pickedId);
        const draft = savedDrafts[scene.id] ?? '';

        return (
          <article
            key={scene.id}
            className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 space-y-4 shadow-sm"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#800020]">
                Escena interactiva {idx + 1} / {scenes.length}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#2B1419]">
                {scene.sceneTitleEs}
              </h3>
              <p className="text-sm font-armenian text-[#800020]">{scene.sceneTitleHy}</p>
            </div>

            <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4">
              <ClickableSpanish
                es={scene.situationEs}
                hy={scene.situationHy}
                withAudio
                className="text-base font-medium text-[#2B1419]"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
                Elige cómo continúa la escena:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scene.branches.map((branch) => {
                  const active = pickedId === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleChooseBranch(scene.id, branch.id)}
                      className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                        active
                          ? 'bg-[#800020] text-white border-[#800020]'
                          : 'bg-white border-[#EBD9C4] text-[#2B1419] hover:border-[#800020]'
                      }`}
                    >
                      <p className="text-sm font-semibold">{branch.labelEs}</p>
                      <p className={`text-xs font-armenian ${active ? 'text-[#FFD54F]' : 'text-[#6E4A52]'}`}>
                        {branch.labelHy}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {pickedBranch && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5 animate-pop-success">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Desarrollo de tu historia
                </span>
                <ClickableSpanish
                  es={pickedBranch.outcomeEs}
                  hy={pickedBranch.outcomeHy}
                  defaultOpen
                  withAudio
                  className="text-sm sm:text-base font-medium text-[#2B1419]"
                />
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-[#EBD9C4]/70">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6E4A52]">
                O escribe tu propia continuación del diálogo (se guarda automáticamente):
              </label>
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => {
                  onSaveDraft(chapterId, scene.id, e.target.value);
                  if (e.target.value.trim().length > 15 && !pickedId) {
                    onFinish(Math.max(1, Object.keys(selectedBranches).length), scenes.length);
                  }
                }}
                placeholder="Milagros: — ¡Escuchame bien! ..."
                className="w-full rounded-xl border border-[#EBD9C4] p-3 text-sm text-[#2B1419] focus:outline-none focus:border-[#800020]"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
};

/* ============================================================================
   12. MILLIONAIRE GRAND CONTEST (Game 18: 30 progressive questions + lifelines)
   ============================================================================ */
const MillionaireGame: React.FC<{
  questions: MillionaireQuestion[];
  onFinish: (score: number, total: number, extra: { stars: number; bonusPoints: number }) => void;
  onBack: () => void;
}> = ({ questions, onFinish, onBack }) => {
  const buildOrdered = () => [
    ...shuffleArray(questions.filter((q) => q.tier === 1)),
    ...shuffleArray(questions.filter((q) => q.tier === 2)),
    ...shuffleArray(questions.filter((q) => q.tier === 3)),
  ];

  const [deck, setDeck] = useState<MillionaireQuestion[]>(() => buildOrdered());
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState<ShuffledOption[]>(() =>
    deck[0]
      ? shuffleArray(
          deck[0].options.map((o, i) => ({ es: o.es, hy: o.hy, isCorrect: i === deck[0].correctIndex }))
        )
      : []
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [points, setPoints] = useState(0);
  const [done, setDone] = useState(false);

  // Lifelines (each usable 2 times across 30 questions)
  const [fiftyLeft, setFiftyLeft] = useState(2);
  const [hintLeft, setHintLeft] = useState(2);
  const [audienceLeft, setAudienceLeft] = useState(2);
  const [hiddenIdx, setHiddenIdx] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [audiencePercents, setAudiencePercents] = useState<number[] | null>(null);

  const cur = deck[idx];

  const loadQuestion = (q: MillionaireQuestion) => {
    setOptions(
      shuffleArray(q.options.map((o, i) => ({ es: o.es, hy: o.hy, isCorrect: i === q.correctIndex })))
    );
    setPicked(null);
    setHiddenIdx([]);
    setShowHint(false);
    setAudiencePercents(null);
  };

  const handleReplay = () => {
    const fresh = buildOrdered();
    setDeck(fresh);
    setIdx(0);
    if (fresh[0]) loadQuestion(fresh[0]);
    setCorrect(0);
    setWrong(0);
    setPoints(0);
    setFiftyLeft(2);
    setHintLeft(2);
    setAudienceLeft(2);
    setDone(false);
  };

  const useFiftyFifty = () => {
    if (fiftyLeft <= 0 || picked !== null || hiddenIdx.length > 0) return;
    const wrongIndices = options
      .map((o, i) => ({ o, i }))
      .filter((x) => !x.o.isCorrect)
      .map((x) => x.i);
    setHiddenIdx(shuffleArray(wrongIndices).slice(0, 2));
    setFiftyLeft((n) => n - 1);
  };

  const useHint = () => {
    if (hintLeft <= 0 || showHint) return;
    setShowHint(true);
    setHintLeft((n) => n - 1);
  };

  const useAudience = () => {
    if (audienceLeft <= 0 || audiencePercents) return;
    const correctPos = options.findIndex((o) => o.isCorrect);
    const pcts = [0, 0, 0, 0];
    const mainPct = 56 + Math.floor(Math.random() * 20);
    pcts[correctPos] = mainPct;
    let rem = 100 - mainPct;
    const others = [0, 1, 2, 3].filter((i) => i !== correctPos);
    others.forEach((pos, k) => {
      if (k === others.length - 1) pcts[pos] = rem;
      else {
        const slice = Math.floor(Math.random() * (rem + 1));
        pcts[pos] = slice;
        rem -= slice;
      }
    });
    setAudiencePercents(pcts);
    setAudienceLeft((n) => n - 1);
  };

  const handleChoose = (i: number) => {
    if (picked !== null || !cur) return;
    setPicked(i);
    if (options[i]?.isCorrect) {
      setCorrect((c) => c + 1);
      setPoints((p) => p + cur.tier * 50);
    } else {
      setWrong((w) => w + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= deck.length) {
      const ratio = correct / Math.max(deck.length, 1);
      const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : correct > 0 ? 1 : 0;
      setDone(true);
      onFinish(correct, deck.length, { stars, bonusPoints: points });
    } else {
      const n = idx + 1;
      setIdx(n);
      loadQuestion(deck[n]);
    }
  };

  if (done) {
    return (
      <GameResultBanner
        title="El gran concurso — Resultado final"
        correct={correct}
        wrong={wrong}
        total={deck.length}
        extraPoints={points}
        onReplay={handleReplay}
        onBack={onBack}
      />
    );
  }
  if (!cur) return null;

  const tierLabel =
    cur.tier === 1 ? 'Nivel 1 · Base' : cur.tier === 2 ? 'Nivel 2 · Intermedio' : 'Nivel 3 · Experto';

  return (
    <div className="bg-[#2B1419] text-[#FFF8E7] rounded-2xl border border-[#FFD54F]/40 p-5 sm:p-7 space-y-5 shadow-md">
      {/* Top Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#FFD54F]">
            El gran concurso · {tierLabel}
          </span>
          <p className="text-sm text-[#FFF8E7]/80 tabular-nums mt-0.5">
            Pregunta {idx + 1} / {deck.length} · Puntos acumulados: <strong className="text-[#FFD54F]">{points}</strong>
          </p>
        </div>

        {/* Lifelines */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useFiftyFifty}
            disabled={fiftyLeft <= 0 || picked !== null || hiddenIdx.length > 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold text-[#FFD54F] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            50:50 ({fiftyLeft})
          </button>
          <button
            type="button"
            onClick={useHint}
            disabled={hintLeft <= 0 || showHint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold text-[#FFD54F] cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Pista armenio ({hintLeft})
          </button>
          <button
            type="button"
            onClick={useAudience}
            disabled={audienceLeft <= 0 || audiencePercents !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold text-[#FFD54F] cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Público ({audienceLeft})
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-xl bg-white/10 border border-[#FFD54F]/30 p-5 space-y-2">
        <ClickableSpanish
          es={cur.questionEs}
          hy={cur.questionHy}
          className="text-lg sm:text-xl font-bold text-[#FFF8E7]"
          hyClassName="text-sm sm:text-base text-[#FFD54F] font-armenian mt-2 bg-black/30 rounded-lg px-3 py-2"
        />
        {showHint && (
          <div className="mt-2 rounded-lg bg-[#FFD54F]/15 border border-[#FFD54F]/40 px-3.5 py-2 text-sm text-[#FFD54F] font-armenian animate-pop-success">
            Հուշում՝ {cur.hintHy}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          if (hiddenIdx.includes(i)) {
            return (
              <div
                key={i}
                className="rounded-xl border border-white/10 p-4 text-xs text-white/30 italic"
              >
                Opción descartada (50:50)
              </div>
            );
          }
          let cls = 'bg-white/10 border-white/20 text-[#FFF8E7] hover:border-[#FFD54F] hover:bg-white/15';
          if (picked !== null) {
            if (opt.isCorrect) cls = 'bg-emerald-600 border-emerald-400 text-white font-bold';
            else if (i === picked) cls = 'bg-[#E53935] border-red-300 text-white';
            else cls = 'bg-white/5 border-white/10 opacity-50';
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleChoose(i)}
              disabled={picked !== null}
              className={`text-left rounded-xl border p-4 transition-colors cursor-pointer disabled:cursor-default space-y-1 ${cls}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm sm:text-base">
                  <strong className="text-[#FFD54F] mr-2 font-mono">
                    {String.fromCharCode(65 + i)}.
                  </strong>
                  {opt.es}
                </span>
                {audiencePercents && (
                  <span className="font-mono text-xs text-[#FFD54F] tabular-nums">
                    {audiencePercents[i]}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer explanation */}
      {picked !== null && (
        <div className="rounded-xl bg-black/35 border border-[#FFD54F]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pop-success">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#FFD54F]">
              {options[picked]?.isCorrect
                ? `¡Correcto! +${cur.tier * 50} puntos`
                : `Respuesta correcta: ${options.find((o) => o.isCorrect)?.es}`}
            </p>
            <p className="text-sm font-armenian text-[#FFF8E7]">{cur.explanationHy}</p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FFD54F] text-[#2B1419] font-bold text-sm hover:bg-[#FF9800] cursor-pointer shrink-0"
          >
            {idx + 1 >= deck.length ? 'Finalizar concurso' : 'Siguiente pregunta'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   MAIN GAMES HUB & ROUTER
   ============================================================================ */
export const GamesView: React.FC<GamesViewProps> = ({
  chapterId,
  games,
  records,
  speakingNotes,
  storyDrafts,
  onRecordResult,
  onResetGame,
  onSaveSpeakingNote,
  onSaveStoryDraft,
  onJumpToVideo,
}) => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const activeMeta = useMemo(
    () => GAMES_CATALOG.find((g) => g.id === activeGameId) ?? null,
    [activeGameId]
  );

  const completedGamesCount = GAMES_CATALOG.filter((g) => records[g.id]?.completed).length;

  const renderActiveGame = () => {
    if (!activeGameId) return null;
    const goBack = () => setActiveGameId(null);

    switch (activeGameId) {
      case 'game1':
        return (
          <MultipleChoiceGame
            gameId="game1"
            title="Juego 1 · Comprensión auditiva"
            chapterId={chapterId}
            questions={games.game1Listening}
            mode="listening"
            onFinish={(s, t) => onRecordResult(chapterId, 'game1', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game2':
        return (
          <FillBlankGame
            questions={games.game2FillBlank}
            onFinish={(s, t) => onRecordResult(chapterId, 'game2', s, t)}
            onBack={goBack}
          />
        );
      case 'game3':
        return (
          <MultipleChoiceGame
            gameId="game3"
            title="Juego 3 · ¿Quién lo dijo?"
            chapterId={chapterId}
            questions={games.game3WhoSaidIt}
            mode="who"
            onFinish={(s, t) => onRecordResult(chapterId, 'game3', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game4':
        return (
          <TrueFalseGame
            questions={games.game4TrueFalse}
            onFinish={(s, t) => onRecordResult(chapterId, 'game4', s, t)}
            onBack={goBack}
          />
        );
      case 'game5':
        return (
          <OrderPhraseGame
            questions={games.game5OrderPhrase}
            onFinish={(s, t) => onRecordResult(chapterId, 'game5', s, t)}
            onBack={goBack}
          />
        );
      case 'game6':
        return (
          <MemoryGame
            pairs={games.game6Memory}
            onFinish={(s, t) => onRecordResult(chapterId, 'game6', s, t)}
            onBack={goBack}
          />
        );
      case 'game7':
        return (
          <MultipleChoiceGame
            gameId="game7"
            title="Juego 7 · Completa el diálogo"
            chapterId={chapterId}
            questions={games.game7CompleteDialogue}
            mode="dialogue"
            onFinish={(s, t) => onRecordResult(chapterId, 'game7', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game8':
        return (
          <TranslateGame
            title="Juego 8 · Traduce al español"
            direction="to-es"
            questions={games.game8TranslateToEs}
            onFinish={(s, t) => onRecordResult(chapterId, 'game8', s, t)}
            onBack={goBack}
          />
        );
      case 'game9':
        return (
          <TranslateGame
            title="Juego 9 · Traduce al armenio"
            direction="to-hy"
            questions={games.game9TranslateToHy}
            onFinish={(s, t) => onRecordResult(chapterId, 'game9', s, t)}
            onBack={goBack}
          />
        );
      case 'game10':
        return (
          <DetectErrorGame
            questions={games.game10DetectError}
            onFinish={(s, t) => onRecordResult(chapterId, 'game10', s, t)}
            onBack={goBack}
          />
        );
      case 'game11':
        return (
          <PasapalabraGame
            entries={games.game11Pasapalabra}
            onFinish={(s, t) => onRecordResult(chapterId, 'game11', s, t)}
            onBack={goBack}
          />
        );
      case 'game12':
        return (
          <MultipleChoiceGame
            gameId="game12"
            title="Juego 12 · Elige el tiempo verbal"
            chapterId={chapterId}
            questions={games.game12VerbTense}
            mode="verb"
            onFinish={(s, t) => onRecordResult(chapterId, 'game12', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game13':
        return (
          <MultipleChoiceGame
            gameId="game13"
            title="Juego 13 · ¿Qué significa?"
            chapterId={chapterId}
            questions={games.game13WhatMeans}
            mode="meaning"
            onFinish={(s, t) => onRecordResult(chapterId, 'game13', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game14':
        return (
          <DictationGame
            chapterId={chapterId}
            questions={games.game14Dictation}
            onFinish={(s, t) => onRecordResult(chapterId, 'game14', s, t)}
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game15':
        return (
          <MultipleChoiceGame
            gameId="game15"
            title="Juego 15 · Responde rápido"
            chapterId={chapterId}
            questions={games.game15SpeedQuiz}
            mode="speed"
            onFinish={(s, t, elapsed) =>
              onRecordResult(chapterId, 'game15', s, t, { bestTimeSec: elapsed })
            }
            onBack={goBack}
            onJumpToVideo={onJumpToVideo}
          />
        );
      case 'game16':
        return (
          <SpeakSpanishGame
            chapterId={chapterId}
            questions={games.game16SpeakSpanish}
            savedNotes={speakingNotes}
            onSaveNote={onSaveSpeakingNote}
            onFinish={(s, t) => onRecordResult(chapterId, 'game16', s, t)}
            onBack={goBack}
          />
        );
      case 'game17':
        return (
          <ContinueStoryGame
            chapterId={chapterId}
            scenes={games.game17ContinueStory}
            savedDrafts={storyDrafts}
            onSaveDraft={onSaveStoryDraft}
            onFinish={(s, t) => onRecordResult(chapterId, 'game17', s, t)}
          />
        );
      case 'game18':
        return (
          <MillionaireGame
            questions={games.game18Millionaire}
            onFinish={(s, t, extra) => onRecordResult(chapterId, 'game18', s, t, extra)}
            onBack={goBack}
          />
        );
      default:
        return null;
    }
  };

  if (activeMeta) {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#EBD9C4] px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveGameId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] text-xs font-semibold text-[#800020] hover:border-[#800020] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Todos los juegos
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-[#2B1419]">
                Juego {activeMeta.number} · {activeMeta.title}
              </h2>
              <p className="text-xs font-armenian text-[#6E4A52]">{activeMeta.subtitleHy}</p>
            </div>
          </div>

          {records[activeMeta.id] && (
            <button
              type="button"
              onClick={() => onResetGame(chapterId, activeMeta.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EBD9C4] text-xs font-semibold text-[#A51C30] hover:bg-red-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar ejercicio
            </button>
          )}
        </div>

        {renderActiveGame()}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2B1419] flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-[#800020]" />
            18 juegos interactivos — Capítulo {chapterId}
          </h2>
          <p className="text-sm text-[#6E4A52] mt-1">
            Orden y opciones mezclados automáticamente en cada partida · Haz clic en cualquier frase en español dentro de los juegos para ver su traducción al armenio.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6E4A52] block">
            Juegos completados
          </span>
          <span className="font-display text-2xl font-bold text-[#800020] tabular-nums">
            {completedGamesCount} / 18
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES_CATALOG.map((meta) => {
          const rec = records[meta.id];
          return (
            <article
              key={meta.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between gap-4 transition-all hover:border-[#800020] ${
                rec?.completed ? 'border-emerald-300' : 'border-[#EBD9C4]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="text-[#800020]">
                    Juego {meta.number} · {meta.totalLabel}
                  </span>
                  {rec?.stars ? (
                    <span className="inline-flex items-center gap-0.5 text-[#FF9800]">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className="w-3.5 h-3.5"
                          fill={s <= (rec.stars ?? 0) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </span>
                  ) : null}
                </div>

                <h3 className="font-display text-xl font-bold text-[#2B1419]">{meta.title}</h3>
                <p className="text-xs sm:text-sm text-[#6E4A52]">{meta.subtitleEs}</p>
                <p className="text-xs font-armenian text-[#800020]">{meta.subtitleHy}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#EBD9C4]/70">
                {rec && (
                  <div className="flex items-center justify-between text-xs text-[#6E4A52] tabular-nums">
                    <span>
                      Mejor: <strong className="text-[#2B1419]">{rec.bestScore}/{rec.totalQuestions}</strong>
                      {rec.bestTimeSec !== undefined ? ` · ${formatTime(rec.bestTimeSec)}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onResetGame(chapterId, meta.id)}
                      className="text-[#A51C30] hover:underline font-semibold cursor-pointer"
                    >
                      Reiniciar
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveGameId(meta.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer"
                >
                  {rec?.completed ? 'Jugar otra vez' : 'Comenzar juego'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
