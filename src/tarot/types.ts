export type TarotArcana = 'major' | 'minor';

export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export type TarotElement = 'Дух' | 'Огонь' | 'Вода' | 'Воздух' | 'Земля';

export type Orientation = 'upright' | 'reversed';

export interface TarotCard {
  id: string;
  number: number;
  roman: string;
  nameRu: string;
  nameEn: string;
  arcana: TarotArcana;
  suit: TarotSuit;
  element: TarotElement;
  archetype: string;
  symbolism: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
}

export interface SpreadPosition {
  index: number;
  title: string;
  focus: string;
}

export interface DrawnCard {
  position: SpreadPosition;
  card: TarotCard;
  orientation: Orientation;
}

export interface SpreadStructureSummary {
  totalCards: number;
  majorCount: number;
  minorCount: number;
  uprightCount: number;
  reversedCount: number;
  suitCounts: Record<TarotSuit, number>;
  repeatingSuits: string[];
  repeatingNumbers: Array<{ number: number; label: string; cards: string[] }>;
  courtCards: string[];
  elementCounts: Record<TarotElement, number>;
  predominanceNote: string;
}

export interface CardAnalysisItem {
  positionIndex: number;
  cardName: string;
  orientationLabel: string;
  classicalMeaning: string;
  visualSymbolism: string;
  archetypeAndNumerology: string;
  consciousVsSubconscious: string;
  contextMeaning: string;
  psychologicalSubtext: string;
  hiddenMotivesAndConflicts: string;
  alternativeInterpretations: string;
  positiveAndNegativeSides: string;
  orientationSignificance: string;
}

export interface TarotInterpretation {
  overview: string;
  cardsListSummary: string[];
  cardAnalyses: CardAnalysisItem[];
  interactions: string;
  systemicAnalysis: string;
  alternativeReadings: string;
  nonObviousMeaning: string;
  mainContradiction: string;
  mainConclusion: string;
  attentionPoints: string;
}

export interface DeepenedAnalysis {
  id: string;
  createdAt: string;
  focusAngle: string;
  newPerspective: string;
  unexploredSymbolsAndPairings: string;
  deepenedPsychology: string;
  refinedSynthesis: string;
}

export interface SpreadAssessmentReady {
  status: 'ready';
  spreadType: '3-card' | '5-card' | '7-card';
  spreadName: string;
  spreadRationale: string;
  drawnCards: DrawnCard[];
}

export interface SpreadAssessmentClarification {
  status: 'needs_clarification';
  clarifyingQuestion: string;
  reason: string;
}

export type SpreadAssessmentResponse =
  | SpreadAssessmentReady
  | SpreadAssessmentClarification;

export interface ConsultationSession {
  id: string;
  createdAt: string;
  question: string;
  clarifyingQuestion?: string;
  clarificationAnswer?: string;
  spreadName: string;
  spreadType: '3-card' | '5-card' | '7-card';
  spreadRationale: string;
  drawnCards: DrawnCard[];
  interpretation: TarotInterpretation;
  deepenedAnalyses?: DeepenedAnalysis[];
}
