import {
  FSRS,
  FSRSParameters,
  Card as FSRSCard,
  generatorParameters,
  Rating,
  createEmptyCard,
} from 'ts-fsrs';
import {
  CardState,
  PerformanceResponse,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '.';

type ValidRating = Exclude<Rating, Rating.Manual>;

type FSRSRating = Exclude<Rating, Rating.Manual>;

export class FSRSAlgorithm extends SpacedRepetitionAlgorithm<FSRSParameters> {
  private fsrs: FSRS;
  private cardMap: Map<string, FSRSCard>;

  constructor(parameters: Partial<FSRSParameters> = {}) {
    super(parameters);
    this.fsrs = new FSRS(this.parameters);
    this.cardMap = new Map();
  }

  public getDefaultValues(): FSRSParameters {
    return generatorParameters();
  }

  public scheduleReview(item: SpacedRepetitionItem): void {
    let fsrsCard = this.cardMap.get(item.id);
    if (!fsrsCard) {
      fsrsCard = createEmptyCard<FSRSCard>(item.nextReviewDate ?? new Date());
      this.cardMap.set(item.id, fsrsCard);
      this.syncFromFSRSCard(item, fsrsCard);
    }

    item.nextReviewDate = fsrsCard.due;
    this.addToQueueIfDueToday(item);
  }

  public updateItemAfterReview(
    item: SpacedRepetitionItem,
    performanceResponse: number,
  ): void {
    if (!this.isValidRating(performanceResponse)) {
      return;
    }

    const fsrsCard = this.cardMap.get(item.id);
    if (!fsrsCard) {
      return;
    }

    const now = new Date();
    const scheduling = this.fsrs.repeat(fsrsCard, now);
    const updatedCard = scheduling[performanceResponse].card;

    this.cardMap.set(item.id, updatedCard);
    item.lastReviewDate = now;
    this.syncFromFSRSCard(item, updatedCard);
    item.iteration += 1;

    this.addToQueueIfDueToday(item);
  }

  public getNextReviewItem(): SpacedRepetitionItem | null {
    return this.queuedItems.shift() ?? null;
  }

  public calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date {
    const rating = this.mapPerformanceResponse(performanceResponse);

    const fsrsCard = this.cardMap.get(item.id);
    if (!fsrsCard) {
      return item.nextReviewDate ?? new Date();
    }

    const now = new Date();
    const scheduling = this.fsrs.repeat(fsrsCard, now);
    return scheduling[rating].card.due;
  }

  public setParameters(parameters: Partial<FSRSParameters>): void {
    super.setParameters(parameters);
    this.fsrs = new FSRS(this.parameters);
  }

  public mapPerformanceResponse(
    performanceResponse: PerformanceResponse,
  ): FSRSRating {
    switch (performanceResponse) {
      case PerformanceResponse.AGAIN:
        return Rating.Again;
      case PerformanceResponse.HARD:
        return Rating.Hard;
      case PerformanceResponse.GOOD:
        return Rating.Good;
      case PerformanceResponse.EASY:
        return Rating.Easy;
    }
  }

  private isValidRating(rating: Rating): rating is ValidRating {
    return rating !== Rating.Manual;
  }

  private syncFromFSRSCard(
    item: SpacedRepetitionItem,
    fsrsCard: FSRSCard,
  ): void {
    item.nextReviewDate = fsrsCard.due;

    if (fsrsCard.last_review) {
      item.lastReviewDate = fsrsCard.last_review;
    }

    item.state = this.mapStateFromFSRS(fsrsCard.state);

    item.metadata = {
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      scheduled_days: fsrsCard.scheduled_days,
      learning_steps: fsrsCard.learning_steps,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
    };
  }

  private mapStateFromFSRS(fsrsState: number): CardState {
    const stateMap = [
      CardState.NEW,
      CardState.LEARNING,
      CardState.REVIEW,
      CardState.RELEARNING,
    ];
    return stateMap[fsrsState] ?? CardState.NEW;
  }
}
