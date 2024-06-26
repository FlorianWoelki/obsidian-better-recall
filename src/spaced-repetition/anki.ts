import { SpacedRepetitionAlgorithm, SpacedRepetitionItem } from '.';

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

export class AnkiAlgorithm extends SpacedRepetitionAlgorithm {
  public scheduleReview(item: SpacedRepetitionItem): void {
    const now = new Date();
    item.lastReviewDate = now;
    item.nextReviewDate = new Date(
      now.getTime() + item.interval * 24 * 60 * 60 * 1000,
    );
  }

  public getNextReviewItem(): SpacedRepetitionItem | null {
    const now = new Date();
    return (
      this.items.find(
        (item) => item.nextReviewDate && item.nextReviewDate <= now,
      ) ?? null
    );
  }

  public updateItemAfterReview(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): void {
    const lastInterval = item.interval;
    switch (performanceResponse) {
      case PerformanceResponse.AGAIN:
        item.easeFactor = Math.max(1.3, item.easeFactor - 0.2);
        item.interval *= lapseInterval;
        break;
      case PerformanceResponse.HARD:
        item.easeFactor = Math.max(1.3, item.easeFactor - 0.15);
        item.interval *= 1.2;
        if (item.interval - lastInterval < 1) {
          item.interval = lastInterval + 1;
        }
        break;
      case PerformanceResponse.GOOD:
        if (item.iteration === 1) {
          item.interval = graduatingInterval;
        } else {
          item.interval *= item.easeFactor;
          if (item.interval - lastInterval < 1) {
            item.interval = lastInterval + 1;
          }
        }
        break;
      case PerformanceResponse.EASY:
        item.easeFactor += 0.15;
        if (item.iteration === 1) {
          item.interval = easyInterval;
        } else {
          item.interval *= item.easeFactor * easyBonus;
        }
        break;
    }

    item.iteration += 1;
    this.scheduleReview(item);
  }
}
