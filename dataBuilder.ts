import {
  ChapterId,
  DetectErrorQuestion,
  DictationQuestion,
  FillBlankQuestion,
  MemoryPair,
  MillionaireQuestion,
  MultipleChoiceQuestion,
  OpenSpeakingQuestion,
  OrderPhraseQuestion,
  PasapalabraEntry,
  TranslateQuestion,
  TrueFalseQuestion,
  VocabItem,
} from './types';
import { formatTime } from './uiHelpers';

export type VocabTuple = [
  spanish: string,
  hy: string,
  explanationEs: string,
  explanationHy: string,
  episodeExample: string,
  episodeExampleHy: string,
  dailyExample: string,
  dailyExampleHy: string,
  timestamp: number,
  isArgentinism: boolean,
  register: VocabItem['register'],
  registerNoteHy?: string
];

export function buildVocabList(chapterId: ChapterId, tuples: VocabTuple[]): VocabItem[] {
  return tuples.map((t, idx) => ({
    id: `cap${chapterId}-voc-${idx + 1}`,
    chapterId,
    spanish: t[0],
    hy: t[1],
    explanationEs: t[2],
    explanationHy: t[3],
    episodeExample: t[4],
    episodeExampleHy: t[5],
    dailyExample: t[6],
    dailyExampleHy: t[7],
    timestamp: t[8],
    timeLabel: formatTime(t[8]),
    isArgentinism: t[9],
    register: t[10],
    registerNoteHy: t[11],
  }));
}

export type MCQTuple = [
  questionEs: string,
  questionHy: string,
  options: [string, string][],
  correctIndex: number,
  explanationHy: string,
  timestamp?: number,
  quoteEs?: string,
  quoteHy?: string
];

export function buildMCQs(prefix: string, tuples: MCQTuple[]): MultipleChoiceQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    questionEs: t[0],
    questionHy: t[1],
    options: t[2].map(([es, hy]) => ({ es, hy })),
    correctIndex: t[3],
    explanationHy: t[4],
    timestamp: t[5],
    timeLabel: t[5] !== undefined ? formatTime(t[5]) : undefined,
    quoteEs: t[6],
    quoteHy: t[7],
  }));
}

export type FillTuple = [
  before: string,
  after: string,
  answer: string,
  distractors: [string, string, string],
  fullHy: string,
  explanationHy: string,
  timestamp?: number
];

export function buildFillBlanks(prefix: string, tuples: FillTuple[]): FillBlankQuestion[] {
  return tuples.map((t, idx) => {
    const fullEs = `${t[0]}${t[2]}${t[1]}`.replace(/\s+/g, ' ').trim();
    return {
      id: `${prefix}-${idx + 1}`,
      sentenceBefore: t[0],
      sentenceAfter: t[1],
      fullEs,
      fullHy: t[4],
      options: [t[2], ...t[3]],
      correctAnswer: t[2],
      explanationHy: t[5],
      timestamp: t[6],
      timeLabel: t[6] !== undefined ? formatTime(t[6]) : undefined,
    };
  });
}

export type TFTuple = [statementEs: string, statementHy: string, isTrue: boolean, explanationHy: string];

export function buildTrueFalse(prefix: string, tuples: TFTuple[]): TrueFalseQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    statementEs: t[0],
    statementHy: t[1],
    isTrue: t[2],
    explanationHy: t[3],
  }));
}

export type OrderTuple = [words: string[], hy: string, explanationHy: string];

export function buildOrderPhrases(prefix: string, tuples: OrderTuple[]): OrderPhraseQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    correctOrder: t[0],
    hy: t[1],
    explanationHy: t[2],
  }));
}

export type MemoryTuple = [mode: MemoryPair['mode'], left: string, right: string, hyHint: string];

export function buildMemoryPairs(prefix: string, tuples: MemoryTuple[]): MemoryPair[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    mode: t[0],
    left: t[1],
    right: t[2],
    hyHint: t[3],
  }));
}

export type TranslateTuple = [
  sourceText: string,
  displayAnswer: string,
  acceptedAnswers: string[],
  explanationHy: string,
  sourceHy?: string
];

export function buildTranslateList(prefix: string, tuples: TranslateTuple[]): TranslateQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    sourceText: t[0],
    displayAnswer: t[1],
    acceptedAnswers: t[2],
    explanationHy: t[3],
    sourceHy: t[4],
  }));
}

export type ErrorTuple = [
  wrongEs: string,
  correctEs: string,
  hy: string,
  wrongWord: string,
  correctWord: string,
  options: [string, string, string, string],
  explanationHy: string
];

export function buildDetectErrors(prefix: string, tuples: ErrorTuple[]): DetectErrorQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    wrongEs: t[0],
    correctEs: t[1],
    hy: t[2],
    wrongWord: t[3],
    correctWord: t[4],
    options: t[5],
    explanationHy: t[6],
  }));
}

export type PasaTuple = [letter: string, answer: string, definitionEs: string, definitionHy: string, contains?: boolean];

export function buildPasapalabra(tuples: PasaTuple[]): PasapalabraEntry[] {
  return tuples.map((t) => ({
    letter: t[0],
    answer: t[1],
    definitionEs: t[2],
    definitionHy: t[3],
    containsMode: t[4],
  }));
}

export type DictationTuple = [textEs: string, hy: string, timestamp: number, explanationHy: string];

export function buildDictation(prefix: string, tuples: DictationTuple[]): DictationQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    textEs: t[0],
    hy: t[1],
    timestamp: t[2],
    timeLabel: formatTime(t[2]),
    explanationHy: t[3],
  }));
}

export type SpeakingTuple = [
  questionEs: string,
  questionHy: string,
  modelAnswerEs: string,
  modelAnswerHy: string,
  usefulPhrases: [string, string][]
];

export function buildSpeaking(prefix: string, tuples: SpeakingTuple[]): OpenSpeakingQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    questionEs: t[0],
    questionHy: t[1],
    modelAnswerEs: t[2],
    modelAnswerHy: t[3],
    usefulPhrases: t[4].map(([es, hy]) => ({ es, hy })),
  }));
}

export type MillTuple = [
  tier: 1 | 2 | 3,
  questionEs: string,
  questionHy: string,
  options: [string, string][],
  correctIndex: number,
  hintHy: string,
  explanationHy: string
];

export function buildMillionaire(prefix: string, tuples: MillTuple[]): MillionaireQuestion[] {
  return tuples.map((t, idx) => ({
    id: `${prefix}-${idx + 1}`,
    tier: t[0],
    questionEs: t[1],
    questionHy: t[2],
    options: t[3].map(([es, hy]) => ({ es, hy })),
    correctIndex: t[4],
    hintHy: t[5],
    explanationHy: t[6],
  }));
}
