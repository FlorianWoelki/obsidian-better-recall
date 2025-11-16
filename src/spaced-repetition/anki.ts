import { AnkiParameters, DEFAULT_SETTINGS } from '../settings/data';
import {
  CardState,
  CardType,
  PerformanceResponse,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '.';

enum AnkiRating {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class AnkiAlgorithm extends SpacedRepetitionAlgorithm<AnkiParameters> {
  public getDefaultValues(): AnkiParameters {
    return DEFAULT_SETTINGS.ankiParameters;
  }

  public createNewCard(
    id: string,
    content: { front: string; back: string },
  ): SpacedRepetitionItem {
    const item: SpacedRepetitionItem = {
      id,
      type: CardType.BASIC,
      content,
      state: CardState.NEW,
      iteration: 0,
      metadata: {
        easeFactor: 2.5,
        interval: 0,
        stepIndex: 0,
      },
    };

    this.scheduleReview(item);
    return item;
  }

  private get updateStrategies() {
    return {
      [AnkiRating.AGAIN]: (item: SpacedRepetitionItem) => {
        item.metadata.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          item.metadata.easeFactor - this.parameters.easeFactorDecrement,
        );
        if (item.state === CardState.REVIEW) {
          item.state = CardState.RELEARNING;
          item.metadata.stepIndex = 0;
        } else {
          item.metadata.stepIndex = 0;
        }
        return item.metadata.interval * this.parameters.lapseInterval;
      },
      [AnkiRating.HARD]: (item: SpacedRepetitionItem) => {
        item.metadata.easeFactor = Math.max(
          this.parameters.minEaseFactor,
          item.metadata.easeFactor - this.parameters.easeFactorIncrement,
        );
        if (
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.metadata.stepIndex += 1;
        }
        return Math.max(
          item.metadata.interval * this.parameters.hardIntervalMultiplier,
          item.metadata.interval + 1,
        );
      },
      [AnkiRating.GOOD]: (item: SpacedRepetitionItem) => {
        if (
          item.state === CardState.NEW ||
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.metadata.stepIndex += 1;
          const steps =
            item.state === CardState.LEARNING
              ? this.parameters.learningSteps
              : this.parameters.relearningSteps;
          if (item.metadata.stepIndex >= steps.length) {
            item.state = CardState.REVIEW;
            return this.parameters.graduatingInterval;
          }

          return 0;
        }
        return Math.max(
          item.metadata.interval * item.metadata.easeFactor,
          item.metadata.interval + 1,
        );
      },
      [AnkiRating.EASY]: (item: SpacedRepetitionItem) => {
        item.metadata.easeFactor += this.parameters.easeFactorIncrement;
        if (
          item.state === CardState.NEW ||
          item.state === CardState.LEARNING ||
          item.state === CardState.RELEARNING
        ) {
          item.state = CardState.REVIEW;
          return this.parameters.easyInterval;
        }

        return (
          item.metadata.interval *
          item.metadata.easeFactor *
          this.parameters.easyBonus
        );
      },
    };
  }

  public calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date {
    const rating = this.mapPerformanceResponse(performanceResponse);
    const newItem = { ...item };

    if (newItem.state === CardState.NEW) {
      newItem.state = CardState.LEARNING;
      newItem.metadata.stepIndex = 0;
    }

    const newInterval = this.updateStrategies[rating](newItem);

    const steps =
      newItem.state === CardState.LEARNING
        ? this.parameters.learningSteps
        : this.parameters.relearningSteps;
    if (
      (newItem.state === CardState.LEARNING ||
        newItem.state === CardState.RELEARNING) &&
      newItem.metadata.stepIndex < steps.length
    ) {
      return this.calculateNextReviewDate(
        steps[newItem.metadata.stepIndex],
        true,
      );
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
      if (item.metadata.stepIndex < steps.length) {
        item.nextReviewDate = this.calculateNextReviewDate(
          steps[item.metadata.stepIndex],
          true,
        );
      } else {
        item.nextReviewDate = this.calculateNextReviewDate(
          item.metadata.interval,
        );
        item.state = CardState.REVIEW;
      }
    } else if (item.state === CardState.NEW) {
      item.nextReviewDate = new Date();
    } else {
      item.nextReviewDate = this.calculateNextReviewDate(
        item.metadata.interval,
      );
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
    const rating = this.mapPerformanceResponse(performanceResponse);

    if (item.state === CardState.NEW) {
      item.state = CardState.LEARNING;
      item.metadata.stepIndex = 0;
    }

    item.metadata.interval = this.updateStrategies[rating](item);
    item.iteration += 1;

    this.scheduleReview(item);
  }

  public mapPerformanceResponse(
    performanceResponse: PerformanceResponse,
  ): AnkiRating {
    switch (performanceResponse) {
      case PerformanceResponse.AGAIN:
        return AnkiRating.AGAIN;
      case PerformanceResponse.HARD:
        return AnkiRating.HARD;
      case PerformanceResponse.GOOD:
        return AnkiRating.GOOD;
      case PerformanceResponse.EASY:
        return AnkiRating.EASY;
    }
  }

  private calculateNextReviewDate(interval: number, inMinutes = false): Date {
    const now = new Date();
    const milliseconds =
      interval * (inMinutes ? 60 * 1000 : MILLISECONDS_PER_DAY);
    return new Date(now.getTime() + milliseconds);
  }
}
