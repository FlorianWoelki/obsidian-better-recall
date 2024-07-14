import { AnkiParameters } from '../settings/data';
import { CardState, SpacedRepetitionAlgorithm, SpacedRepetitionItem } from '.';

export enum PerformanceResponse {
  AGAIN,
  HARD,
  GOOD,
  EASY,
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

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

  private get updateStrategies() {
    return {
      [PerformanceResponse.AGAIN]: (item: SpacedRepetitionItem) => {
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
      [PerformanceResponse.HARD]: (item: SpacedRepetitionItem) => {
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
      [PerformanceResponse.GOOD]: (item: SpacedRepetitionItem) => {
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
      [PerformanceResponse.EASY]: (item: SpacedRepetitionItem) => {
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
  }

  public calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date {
    const newItem = { ...item };

    if (newItem.state === CardState.NEW) {
      newItem.state = CardState.LEARNING;
      newItem.stepIndex = 0;
    }

    const newInterval = this.updateStrategies[performanceResponse](newItem);

    const steps =
      newItem.state === CardState.LEARNING
        ? this.parameters.learningSteps
        : this.parameters.relearningSteps;
    if (
      (newItem.state === CardState.LEARNING ||
        newItem.state === CardState.RELEARNING) &&
      newItem.stepIndex < steps.length
    ) {
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
    if (item.state === CardState.NEW) {
      item.state = CardState.LEARNING;
      item.stepIndex = 0;
    }

    item.interval = this.updateStrategies[performanceResponse](item);
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
