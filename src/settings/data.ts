import { DeckJsonStructure } from 'src/data/deck';

export interface BetterRecallData {
  settings: BetterRecallSettings;
  decks: DeckJsonStructure[];
}

export enum SchedulingAlgorithm {
  Anki = 'anki',
  FSRS = 'fsrs',
}

export type ParameterMap = {
  [SchedulingAlgorithm.Anki]: AnkiParameters;
  [SchedulingAlgorithm.FSRS]: FSRSParameters;
};

export interface FSRSParameters {
  /**
   * Array of 19 weight parameters that control the FSRS algorithm's
   * memory model. These are typically optimized based on user review
   * history.
   * @default [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604,
   *          0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605,
   *          2.2698, 0.2315, 2.9898, 0.51655, 0.6621]
   */
  w: number[];
  /**
   * Target retention rate (probability of remembering a card).
   * Trade-off between retention and workload
   * @default 0.9
   */
  requestRetention: number;
  /**
   * Maximum interval in days between reviews.
   * @default 36500
   */
  maximumInterval: number;
  /**
   * Whether to add random variation to intervals to distribute reviews.
   * @default false
   */
  enableFuzz: boolean;
  /**
   * Whether to enable short-term memory handling.
   * @default false
   */
  enableShortTerm: boolean;
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
  fsrsParameters: FSRSParameters;
  /**
   * The scheduling algorithm to use for spaced repetition.
   * - `anki`: Uses the traditional SM-2 based algorithm with ease factors.
   * - `fsrs`: Uses the free spaced repetition scheduler, a modern algorithm
   *   that optimizes intervals based on memory research.
   * @default anki
   */
  schedulingAlgorithm: SchedulingAlgorithm;
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
  fsrsParameters: {
    w: [
      0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
      1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898,
      0.51655, 0.6621,
    ],
    requestRetention: 0.9,
    maximumInterval: 36500,
    enableFuzz: false,
    enableShortTerm: false,
  },
  schedulingAlgorithm: SchedulingAlgorithm.Anki,
};
