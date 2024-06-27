import { CardState, SpacedRepetitionAlgorithm, SpacedRepetitionItem } from '.';

export enum PerformanceResponse {
  AGAIN,
  HARD,
  GOOD,
  EASY,
}

const lapseInterval = 0.5;
const easyInterval = 4;
const easyBonus = 1.3;
const graduatingInterval = 1;
const minEaseFactor = 1.3;
const easeFactorDecrement = 0.2;
const easeFactorIncrement = 0.15;
const hardIntervalMultiplier = 1.2;
const learningSteps = [1, 10];
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const relearningSteps = [10];

export class AnkiAlgorithm extends SpacedRepetitionAlgorithm {
  private calculateNextReviewDate(interval: number, inMinutes = false): Date {
    const now = new Date();
    const milliseconds =
      interval * (inMinutes ? 60 * 1000 : millisecondsPerDay);
    return new Date(now.getTime() + milliseconds);
  }

  public scheduleReview(item: SpacedRepetitionItem): void {
    item.lastReviewDate = new Date();

    if (
      item.state === CardState.LEARNING ||
      item.state === CardState.RELEARNING
    ) {
      const steps =
        item.state === CardState.LEARNING ? learningSteps : relearningSteps;
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
          minEaseFactor,
          item.easeFactor - easeFactorDecrement,
        );
        if (item.state === CardState.REVIEW) {
          item.state = CardState.RELEARNING;
          item.stepIndex = 0;
        } else {
          item.stepIndex = 0;
        }
        return item.interval * lapseInterval;
      },
      [PerformanceResponse.HARD]: () => {
        item.easeFactor = Math.max(
          minEaseFactor,
          item.easeFactor - easeFactorIncrement,
        );
        if (
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.stepIndex += 1;
        }
        return Math.max(
          item.interval * hardIntervalMultiplier,
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
            item.state === CardState.LEARNING ? learningSteps : relearningSteps;
          if (item.stepIndex >= steps.length) {
            item.state = CardState.REVIEW;
            return graduatingInterval;
          }

          return 0;
        }
        return Math.max(item.interval * item.easeFactor, item.interval + 1);
      },
      [PerformanceResponse.EASY]: () => {
        item.easeFactor += easeFactorIncrement;
        if (
          item.state === CardState.NEW ||
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.state = CardState.REVIEW;
          return easyInterval;
        }

        return item.interval * item.easeFactor * easyBonus;
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
}
