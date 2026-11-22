export type ChapterId = 18 | 19 | 20;

export type AppSection =
  | 'inicio'
  | 'cap18'
  | 'cap19'
  | 'cap20'
  | 'videos'
  | 'transcripciones'
  | 'vocabulario'
  | 'argentino'
  | 'gramatica'
  | 'juegos'
  | 'favoritos'
  | 'progreso';

export type ChapterTab = 'video' | 'transcripcion' | 'vocabulario' | 'gramatica' | 'juegos';

export interface SubtitleLine {
  id: string;
  start: number; // seconds
  timeLabel: string; // original timestamp label e.g. "00:12"
  text: string; // exact verbatim original Spanish line
  hy: string; // natural Eastern Armenian translation
  note?: string; // optional note for ASR/transcription clarity without altering original text
}

export interface SubtitleDataset {
  chapterId: ChapterId;
  expectedCount: number;
  isCompleteOfficialImport: boolean;
  lines: SubtitleLine[];
}

export interface VocabItem {
  id: string;
  chapterId: ChapterId;
  spanish: string;
  hy: string;
  explanationEs: string;
  explanationHy: string;
  episodeExample: string;
  episodeExampleHy: string;
  dailyExample: string;
  dailyExampleHy: string;
  timestamp: number;
  timeLabel: string;
  isArgentinism: boolean;
  register: 'neutro' | 'coloquial' | 'muy coloquial' | 'informal / cuidado';
  registerNoteHy?: string;
}

export interface GrammarExercise {
  id: string;
  promptEs: string;
  promptHy: string;
  options: string[];
  correctAnswer: string;
  explanationHy: string;
}

export interface GrammarItem {
  id: string;
  chapterId: ChapterId;
  title: string;
  ruleEs: string;
  explanationHy: string;
  exampleEs: string;
  exampleHy: string;
  timestamp: number;
  timeLabel: string;
  extraExamples: { es: string; hy: string }[];
  exercises: GrammarExercise[];
}

export interface MultipleChoiceQuestion {
  id: string;
  questionEs: string;
  questionHy: string;
  options: { es: string; hy: string }[];
  correctIndex: number;
  explanationHy: string;
  timestamp?: number;
  timeLabel?: string;
  quoteEs?: string;
  quoteHy?: string;
}

export interface FillBlankQuestion {
  id: string;
  sentenceBefore: string;
  sentenceAfter: string;
  fullEs: string;
  fullHy: string;
  options: string[];
  correctAnswer: string;
  explanationHy: string;
  timestamp?: number;
  timeLabel?: string;
}

export interface TrueFalseQuestion {
  id: string;
  statementEs: string;
  statementHy: string;
  isTrue: boolean;
  explanationHy: string;
}

export interface OrderPhraseQuestion {
  id: string;
  correctOrder: string[];
  hy: string;
  explanationHy: string;
}

export interface MemoryPair {
  id: string;
  mode: 'es-hy' | 'phrase-meaning' | 'slang-neutral';
  left: string;
  right: string;
  hyHint: string;
}

export interface TranslateQuestion {
  id: string;
  sourceText: string;
  sourceHy?: string;
  acceptedAnswers: string[];
  displayAnswer: string;
  explanationHy: string;
}

export interface DetectErrorQuestion {
  id: string;
  wrongEs: string;
  correctEs: string;
  hy: string;
  wrongWord: string;
  correctWord: string;
  options: string[];
  explanationHy: string;
}

export interface PasapalabraEntry {
  letter: string;
  answer: string;
  definitionEs: string;
  definitionHy: string;
  containsMode?: boolean;
}

export interface DictationQuestion {
  id: string;
  textEs: string;
  hy: string;
  timestamp: number;
  timeLabel: string;
  explanationHy: string;
}

export interface OpenSpeakingQuestion {
  id: string;
  questionEs: string;
  questionHy: string;
  modelAnswerEs: string;
  modelAnswerHy: string;
  usefulPhrases: { es: string; hy: string }[];
}

export interface StoryBranchPrompt {
  id: string;
  sceneTitleEs: string;
  sceneTitleHy: string;
  situationEs: string;
  situationHy: string;
  branches: {
    id: string;
    labelEs: string;
    labelHy: string;
    outcomeEs: string;
    outcomeHy: string;
  }[];
}

export interface MillionaireQuestion {
  id: string;
  tier: 1 | 2 | 3;
  questionEs: string;
  questionHy: string;
  options: { es: string; hy: string }[];
  correctIndex: number;
  hintHy: string;
  explanationHy: string;
}

export interface ChapterGamesData {
  game1Listening: MultipleChoiceQuestion[];
  game2FillBlank: FillBlankQuestion[];
  game3WhoSaidIt: MultipleChoiceQuestion[];
  game4TrueFalse: TrueFalseQuestion[];
  game5OrderPhrase: OrderPhraseQuestion[];
  game6Memory: MemoryPair[];
  game7CompleteDialogue: MultipleChoiceQuestion[];
  game8TranslateToEs: TranslateQuestion[];
  game9TranslateToHy: TranslateQuestion[];
  game10DetectError: DetectErrorQuestion[];
  game11Pasapalabra: PasapalabraEntry[];
  game12VerbTense: MultipleChoiceQuestion[];
  game13WhatMeans: MultipleChoiceQuestion[];
  game14Dictation: DictationQuestion[];
  game15SpeedQuiz: MultipleChoiceQuestion[];
  game16SpeakSpanish: OpenSpeakingQuestion[];
  game17ContinueStory: StoryBranchPrompt[];
  game18Millionaire: MillionaireQuestion[];
}

export interface ChapterBundle {
  id: ChapterId;
  title: string;
  subtitleEs: string;
  subtitleHy: string;
  youtubeId: string;
  youtubeUrl: string;
  coverImage: string;
  expectedSubtitleLines: number;
  durationApproxSec: number;
  highlightsEs: string[];
  vocabulary: VocabItem[];
  grammar: GrammarItem[];
  games: ChapterGamesData;
}

export type FavoriteCategory = 'word' | 'expression' | 'line' | 'grammar' | 'video';

export interface FavoriteItem {
  id: string;
  chapterId: ChapterId;
  category: FavoriteCategory;
  es: string;
  hy: string;
  extra?: string;
  timestamp?: number;
  timeLabel?: string;
  savedAt: number;
}

export interface GameProgressRecord {
  gameId: string;
  attempts: number;
  bestScore: number;
  totalQuestions: number;
  lastScore: number;
  completed: boolean;
  bestTimeSec?: number;
  stars?: number;
  updatedAt: number;
}

export interface ChapterProgress {
  chapterId: ChapterId;
  lastVideoTime: number;
  maxVideoTime: number;
  videoDuration: number;
  knownVocabIds: string[];
  completedGrammarIds: string[];
  gameRecords: Record<string, GameProgressRecord>;
  points: number;
  studySeconds: number;
  storyDrafts: Record<string, string>;
  speakingNotes: Record<string, string>;
}

export interface AppProgressState {
  chapters: Record<ChapterId, ChapterProgress>;
  favorites: FavoriteItem[];
  argentinoScore: { best: number; total: number; attempts: number };
  lastActiveChapter: ChapterId;
  lastActiveSection: AppSection;
}
