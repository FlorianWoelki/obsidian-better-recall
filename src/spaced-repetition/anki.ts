import { CardState, SpacedRepetitionAlgorithm, SpacedRepetitionItem } from '.';

export enum PerformanceResponse {
  AGAIN,
  HARD,
  GOOD,
  EASY,
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface AnkiParameters {
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

export class AnkiAlgorithm extends SpacedRepetitionAlgorithm<AnkiParameters> {
  public getDefaultValues(): AnkiParameters {
    return {
      lapseInterval: 0.5,
      easyInterval: 4,
      easyBonus: 1.3,
      graduatingInterval: 1,
      minEaseFactor: 1.3,
      easeFactorDecrement: 0.2,
      easeFactorIncrement: 0.15,
      hardIntervalMultiplier: 1.2,
      learningSteps: [1, 10],
      relearningSteps: [10],
    };
  }

  public calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date {
    const newItem = { ...item };

    const updateStrategies = {
      [PerformanceResponse.AGAIN]: () => {
        newItem.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          newItem.easeFactor - this.parameters.easeFactorDecrement,
        );
        if (newItem.state === CardState.REVIEW) {
          newItem.state = CardState.RELEARNING;
          newItem.stepIndex = 0;
        } else {
          newItem.stepIndex = 0;
        }
        return newItem.interval * this.parameters.lapseInterval;
      },
      [PerformanceResponse.HARD]: () => {
        newItem.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          newItem.easeFactor - this.parameters.easeFactorIncrement,
        );
        if (
          newItem.state === CardState.LEARNING ||
          newItem.state === CardState.RELEARNING
        ) {
          newItem.stepIndex += 1;
        }
        return Math.max(
          newItem.interval * this.parameters.hardIntervalMultiplier,
          newItem.interval + 1,
        );
      },
      [PerformanceResponse.GOOD]: () => {
        if (
          newItem.state === CardState.NEW ||
          newItem.state === CardState.LEARNING ||
          newItem.state === CardState.RELEARNING
        ) {
          newItem.stepIndex += 1;
          const steps =
            newItem.state === CardState.LEARNING
              ? this.parameters.learningSteps
              : this.parameters.relearningSteps;
          if (newItem.stepIndex >= steps.length) {
            newItem.state = CardState.REVIEW;
            return this.parameters.graduatingInterval;
          }
          return 0;
        }
        return Math.max(
          newItem.interval * newItem.easeFactor,
          newItem.interval + 1,
        );
      },
      [PerformanceResponse.EASY]: () => {
        newItem.easeFactor += this.parameters.easeFactorIncrement;
        if (
          newItem.state === CardState.NEW ||
          newItem.state === CardState.LEARNING ||
          newItem.state === CardState.RELEARNING
        ) {
          newItem.state = CardState.REVIEW;
          return this.parameters.easyInterval;
        }
        return (
          newItem.interval * newItem.easeFactor * this.parameters.easyBonus
        );
      },
    };

    if (newItem.state === CardState.NEW) {
      newItem.state = CardState.LEARNING;
      newItem.stepIndex = 0;
    }

    const newInterval = updateStrategies[performanceResponse]();

    if (
      (newItem.state === CardState.LEARNING ||
        newItem.state === CardState.RELEARNING) &&
      newItem.stepIndex <
        (newItem.state === CardState.LEARNING
          ? this.parameters.learningSteps
          : this.parameters.relearningSteps
        ).length
    ) {
      const steps =
        newItem.state === CardState.LEARNING
          ? this.parameters.learningSteps
          : this.parameters.relearningSteps;
      return this.calculateNextReviewDate(steps[newItem.stepIndex], true);
    } else {
      return this.calculateNextReviewDate(newInterval);
    }
  }

  public scheduleReview(item: SpacedRepetitionItem): void {
    item.lastReviewDate = new Date();

    if (
      item.state === CardState.LEARNING ||
      item.state === CardState.RELEARNING
    ) {
      const steps =
        item.state === CardState.LEARNING
          ? this.parameters.learningSteps
          : this.parameters.relearningSteps;
      if (item.stepIndex < steps.length) {
        item.nextReviewDate = this.calculateNextReviewDate(
          steps[item.stepIndex],
          true,
        );
      } else {
        item.nextReviewDate = this.calculateNextReviewDate(item.interval);
        item.state = CardState.REVIEW;
      }
    } else if (item.state === CardState.NEW) {
      item.nextReviewDate = new Date();
    } else {
      item.nextReviewDate = this.calculateNextReviewDate(item.interval);
    }

    this.addToQueueIfDueToday(item);
  }

  public getNextReviewItem(): SpacedRepetitionItem | null {
    return this.queuedItems.shift() ?? null;
  }

  public updateItemAfterReview(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): void {
    const updateStrategies = {
      [PerformanceResponse.AGAIN]: () => {
        item.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          item.easeFactor - this.parameters.easeFactorDecrement,
        );
        if (item.state === CardState.REVIEW) {
          item.state = CardState.RELEARNING;
          item.stepIndex = 0;
        } else {
          item.stepIndex = 0;
        }
        return item.interval * this.parameters.lapseInterval;
      },
      [PerformanceResponse.HARD]: () => {
        item.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          item.easeFactor - this.parameters.easeFactorIncrement,
        );
        if (
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.stepIndex += 1;
        }
        return Math.max(
          item.interval * this.parameters.hardIntervalMultiplier,
          item.interval + 1,
        );
      },
      [PerformanceResponse.GOOD]: () => {
        if (
          item.state === CardState.NEW ||
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.stepIndex += 1;
          const steps =
            item.state === CardState.LEARNING
              ? this.parameters.learningSteps
              : this.parameters.relearningSteps;
          if (item.stepIndex >= steps.length) {
            item.state = CardState.REVIEW;
            return this.parameters.graduatingInterval;
          }

          return 0;
        }
        return Math.max(item.interval * item.easeFactor, item.interval + 1);
      },
      [PerformanceResponse.EASY]: () => {
        item.easeFactor += this.parameters.easeFactorIncrement;
        if (
          item.state === CardState.NEW ||
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.state = CardState.REVIEW;
          return this.parameters.easyInterval;
        }

        return item.interval * item.easeFactor * this.parameters.easyBonus;
      },
    };

    if (item.state === CardState.NEW) {
      item.state = CardState.LEARNING;
      item.stepIndex = 0;
    }

    item.interval = updateStrategies[performanceResponse]();
    item.iteration += 1;

    this.scheduleReview(item);
  }

  private calculateNextReviewDate(interval: number, inMinutes = false): Date {
    const now = new Date();
    const milliseconds =
      interval * (inMinutes ? 60 * 1000 : MILLISECONDS_PER_DAY);
    return new Date(now.getTime() + milliseconds);
  }
}
