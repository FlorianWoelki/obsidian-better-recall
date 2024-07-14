import { DeckJsonStructure } from 'src/data/deck';

export interface BetterRecallData {
  settings: BetterRecallSettings;
  decks: DeckJsonStructure[];
}

export interface AnkiParameters {
  /**
   * The multiplier applied to the current interval when a card lapses
   * (is forgotten).
   * @default 0.5
   */
  lapseInterval: number;
  /**
   * The interval (in days) assigned to a card when rated as `easy` during
   * learning/relearning.
   * @default 4
   */
  easyInterval: number;
  /**
   * The multiplier applied to the interval when a review card is rated as
   * `easy`.
   * @default 1.3
   */
  easyBonus: number;
  /**
   * The interval (in days) assigned to a card when it graduates from
   * learning to review.
   * @default 1
   */
  graduatingInterval: number;
  /**
   * The minimum allowed ease factor for a card.
   * @default 1.3
   */
  minEaseFactor: number;
  /**
   * The amount by which the ease factor is decreased when a card is
   * rated as `again`.
   * @default 0.2
   */
  easeFactorDecrement: number;
  /**
   * The amount by which the ease factor is increased when a card is
   * rated as `easy`.
   * @default 0.15
   */
  easeFactorIncrement: number;
  /**
   * The multiplier applied to the current interval when a review card
   * is rated as `hard`.
   * @default 1.2
   */
  hardIntervalMultiplier: number;
  /**
   * An array of step intervals (in minutes) for new cards in the learning
   * phase.
   * @default [1, 10]
   */
  learningSteps: number[];
  /**
   * An array of step intervals (in minutes) for cards in the relearning
   * phase.
   * @default [10]
   */
  relearningSteps: number[];
}

export interface BetterRecallSettings {
  ankiParameters: AnkiParameters;
}

export const DEFAULT_SETTINGS: BetterRecallSettings = {
  ankiParameters: {
    lapseInterval: 0.5,
    easyInterval: 4,
    easyBonus: 1.3,
    graduatingInterval: 1,
    minEaseFactor: 0.2,
    easeFactorDecrement: 0.2,
    easeFactorIncrement: 0.15,
    hardIntervalMultiplier: 1.2,
    learningSteps: [1, 10],
    relearningSteps: [10],
  },
};
