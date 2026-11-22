import React, { useMemo, useState } from 'react';
import {
  Compass,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ARGENTINO_COMPARISON_TABLE,
  ARGENTINO_EXERCISES,
  ARGENTINO_RULES,
  ArgentinoTransformExercise,
} from './dataArgentino';
import { ClickableSpanish, normalizeText, shuffleArray, speakSpanish } from './uiHelpers';

interface ArgentinoViewProps {
  bestScore: number;
  attempts: number;
  onFinishPractice: (score: number, total: number) => void;
}

export const ArgentinoView: React.FC<ArgentinoViewProps> = ({
  bestScore,
  attempts,
  onFinishPractice,
}) => {
  const [tableFilter, setTableFilter] = useState<'all' | 'voseo' | 'imperativo' | 'vocabulario'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'tu-to-vos' | 'vos-to-tu'>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Interactive transformation trainer state
  const [exercises, setExercises] = useState<ArgentinoTransformExercise[]>(() =>
    shuffleArray(ARGENTINO_EXERCISES)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [checkedState, setCheckedState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const filteredTable = useMemo(() => {
    if (tableFilter === 'all') return ARGENTINO_COMPARISON_TABLE;
    return ARGENTINO_COMPARISON_TABLE.filter((row) => row.category === tableFilter);
  }, [tableFilter]);

  const startTrainer = (dir: 'all' | 'tu-to-vos' | 'vos-to-tu') => {
    setDirectionFilter(dir);
    const pool =
      dir === 'all'
        ? ARGENTINO_EXERCISES
        : ARGENTINO_EXERCISES.filter((ex) => ex.direction === dir);
    setExercises(shuffleArray(pool));
    setCurrentIndex(0);
    setInputVal('');
    setCheckedState('idle');
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
  };

  const currentEx = exercises[currentIndex];

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEx || checkedState !== 'idle' || !inputVal.trim()) return;
    const normalizedInput = normalizeText(inputVal);
    const isCorrect = currentEx.acceptedAnswers.some(
      (ans) => normalizeText(ans) === normalizedInput
    );
    if (isCorrect) {
      setCheckedState('correct');
      setCorrectCount((c) => c + 1);
    } else {
      setCheckedState('wrong');
      setWrongCount((w) => w + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= exercises.length) {
      setFinished(true);
      onFinishPractice(correctCount, exercises.length);
    } else {
      setCurrentIndex((i) => i + 1);
      setInputVal('');
      setCheckedState('idle');
    }
  };

  return (
    <section className="space-y-8">
      {/* Section Hero Header */}
      <div className="bg-gradient-to-br from-[#800020] via-[#A51C30] to-[#2B1419] text-[#FFF8E7] rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 text-[#FFD54F] text-xs font-bold uppercase tracking-widest">
          <Compass className="w-4 h-4" />
          <span>Español rioplatense · Buenos Aires</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">
          Español argentino en «Muñeca Brava»
        </h1>
        <p className="text-sm sm:text-base text-[#FFF8E7]/90 mt-2 max-w-3xl leading-relaxed">
          Domina el voseo (vos tenés, vos sabés, vos sos), el imperativo porteño (vení, andá, decime, escuchame) y las expresiones cotidianas de Buenos Aires comparándolas con el español de España y el armenio oriental.
        </p>
        <p className="text-sm text-[#FFD54F] font-armenian mt-2 max-w-3xl leading-relaxed">
          Տիրապետիր արգենտինական իսպաներենի գլխավոր առանձնահատկություններին՝ vos դերանուն, հրամայական ձևեր, արտասանություն և Բուենոս Այրեսի կենդանի խոսակցական արտահայտություններ։
        </p>
      </div>

      {/* 3 Core Rules Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ARGENTINO_RULES.map((rule) => (
          <article
            key={rule.id}
            className="bg-white rounded-2xl border border-[#EBD9C4] p-5 shadow-2xs space-y-3"
          >
            <h2 className="font-display text-xl font-bold text-[#800020]">{rule.titleEs}</h2>
            <p className="text-sm font-semibold text-[#A51C30] font-armenian">{rule.titleHy}</p>
            <p className="text-sm text-[#2B1419] leading-relaxed">{rule.bodyEs}</p>
            <p className="text-sm text-[#6E4A52] font-armenian leading-relaxed pt-2 border-t border-[#EBD9C4]/70">
              {rule.bodyHy}
            </p>
          </article>
        ))}
      </div>

      {/* Interactive Comparison Table: Argentina vs España vs Հայերեն */}
      <div className="bg-white rounded-2xl border border-[#EBD9C4] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#EBD9C4] bg-[#FFF8E7]/60 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#2B1419]">
              Tabla comparativa: Argentina · España · Հայերեն
            </h2>
            <p className="text-sm text-[#6E4A52] mt-1">
              Haz clic en cualquier fila para abrir la nota explicativa y escuchar la pronunciación.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Todos (24)' },
              { id: 'voseo', label: 'Voseo' },
              { id: 'imperativo', label: 'Imperativo' },
              { id: 'vocabulario', label: 'Vocabulario' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTableFilter(tab.id as typeof tableFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  tableFilter === tab.id
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2B1419] text-[#FFF8E7] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Argentina (vos / porteño)</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">España (tú / estándar)</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold font-armenian">Հայերեն</th>
                <th className="py-3.5 px-4 text-right font-semibold">Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBD9C4]/70">
              {filteredTable.map((row) => {
                const isOpen = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedRowId(isOpen ? null : row.id)}
                      className="hover:bg-[#FFF8E7] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#800020]">
                        {row.argentina}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#2B1419]">{row.espana}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#2B1419] font-armenian">
                        {row.hy}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(row.argentina);
                          }}
                          className="p-2 rounded-lg text-[#800020] hover:bg-[#FFD54F]/30 transition-colors cursor-pointer"
                          title="Escuchar pronunciación argentina"
                          aria-label="Escuchar pronunciación argentina"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#FFF8E7]/75">
                        <td colSpan={4} className="px-4 sm:px-6 py-3.5 space-y-1">
                          <p className="text-sm text-[#2B1419]">{row.noteEs}</p>
                          <p className="text-sm text-[#800020] font-armenian">{row.noteHy}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Tú ↔ Vos Transformation Trainer */}
      <div className="bg-white rounded-2xl border border-[#EBD9C4] p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#2B1419] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF9800]" />
              Entrenador interactivo: transforma frases «tú ↔ vos»
            </h2>
            <p className="text-sm text-[#6E4A52] mt-1">
              Mejor resultado guardado: <strong className="text-[#800020] tabular-nums">{bestScore} / 20</strong> ·
              Intentos: <strong className="tabular-nums">{attempts}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Mezclado (20)' },
              { id: 'tu-to-vos', label: 'Tú → Vos' },
              { id: 'vos-to-tu', label: 'Vos → Tú' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => startTrainer(d.id as typeof directionFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  directionFilter === d.id
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-[#2B1419] border-[#EBD9C4] hover:border-[#800020]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {finished ? (
          <div className="rounded-2xl bg-[#FFF8E7] border border-[#FFD54F] p-6 text-center space-y-4">
            <h3 className="font-display text-2xl font-bold text-[#800020]">
              ¡Práctica completada!
            </h3>
            <p className="text-base text-[#2B1419]">
              Aciertos: <strong className="text-emerald-700 tabular-nums">{correctCount}</strong> ·
              Errores: <strong className="text-[#E53935] tabular-nums">{wrongCount}</strong> ·
              Total: <strong className="tabular-nums">{exercises.length}</strong>
            </p>
            <p className="text-sm text-[#6E4A52] font-armenian">
              Հիանալի աշխատանք։ Շարունակիր մարզվել՝ արգենտինական խոսքը ավտոմատ կերպով հասկանալու համար։
            </p>
            <button
              type="button"
              onClick={() => startTrainer(directionFilter)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Volver a jugar
            </button>
          </div>
        ) : (
          currentEx && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#6E4A52]">
                <span className="uppercase tracking-wider text-[#800020]">
                  {currentEx.direction === 'tu-to-vos'
                    ? 'Transforma de España (tú) → Argentina (vos)'
                    : 'Transforma de Argentina (vos) → España (tú)'}
                </span>
                <span className="tabular-nums">
                  Ejercicio {currentIndex + 1} / {exercises.length} · Correctas: {correctCount} · Incorrectas: {wrongCount}
                </span>
              </div>

              <div className="rounded-xl bg-[#FFF8E7] border border-[#EBD9C4] p-4 sm:p-5">
                <ClickableSpanish
                  es={currentEx.promptEs}
                  hy={currentEx.promptHy}
                  withAudio
                  className="text-lg sm:text-xl font-bold text-[#2B1419]"
                />
              </div>

              <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={checkedState !== 'idle'}
                  placeholder={
                    currentEx.direction === 'tu-to-vos'
                      ? 'Escribe la frase en español argentino...'
                      : 'Escribe la frase usando «tú»...'
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-[#EBD9C4] text-base text-[#2B1419] focus:outline-none focus:border-[#800020] disabled:bg-[#FFF8E7]/50"
                />
                {checkedState === 'idle' ? (
                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className="px-6 py-3 rounded-xl bg-[#800020] text-white font-semibold text-sm hover:bg-[#A51C30] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Comprobar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9800] text-[#2B1419] font-bold text-sm hover:bg-[#FFD54F] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </form>

              {checkedState !== 'idle' && (
                <div
                  className={`rounded-xl p-4 border animate-pop-success space-y-1.5 ${
                    checkedState === 'correct'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {checkedState === 'correct' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span className="text-emerald-900">¡Correcto! Respuesta modelo: {currentEx.displayAnswer}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#E53935]" />
                        <span className="text-[#A51C30]">Respuesta correcta: {currentEx.displayAnswer}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-[#2B1419]">{currentEx.explanationEs}</p>
                  <p className="text-sm text-[#800020] font-armenian">{currentEx.explanationHy}</p>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
};
