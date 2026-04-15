import {
  FSRS,
  FSRSParameters,
  Card as FSRSCard,
  generatorParameters,
  Rating,
  State,
  createEmptyCard,
} from 'ts-fsrs';
import {
  CardState,
  CardType,
  PerformanceResponse,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '.';

type FSRSRating = Exclude<Rating, Rating.Manual>;

// Raw FSRS keys supported directly by `ts-fsrs`.
type FSRSSnakeKeys = Partial<FSRSParameters>;

// CamelCase aliases used by this plugin's settings/UI layer.
// These are normalized to snake_case before creating `FSRS`.
type FSRSCamelKeys = {
  requestRetention?: FSRSParameters['request_retention'];
  maximumInterval?: FSRSParameters['maximum_interval'];
  learningSteps?: FSRSParameters['learning_steps'];
  relearningSteps?: FSRSParameters['relearning_steps'];
  enableFuzz?: FSRSParameters['enable_fuzz'];
  enableShortTerm?: FSRSParameters['enable_short_term'];
};

// Public parameter input accepted by `FSRSAlgorithm`.
// Supports both snake_case (`ts-fsrs`) and camelCase (plugin settings) keys.
export type FSRSConfigInput = FSRSSnakeKeys & FSRSCamelKeys;

export class FSRSAlgorithm extends SpacedRepetitionAlgorithm<FSRSParameters> {
  private fsrs: FSRS;
  private cardMap: Map<string, FSRSCard>;

  private static readonly STATE_MAP: ReadonlyArray<[CardState, State]> = [
    [CardState.NEW, State.New],
    [CardState.LEARNING, State.Learning],
    [CardState.REVIEW, State.Review],
    [CardState.RELEARNING, State.Relearning],
  ];

  constructor(parameters: FSRSConfigInput = {}) {
    super(FSRSAlgorithm.normalizeParameters(parameters));
    this.fsrs = new FSRS(this.parameters);
    this.cardMap = new Map();
  }

  public getDefaultValues(): FSRSParameters {
    return generatorParameters();
  }

  public createNewCard(
    id: string,
    content: { front: string; back: string },
  ): SpacedRepetitionItem {
    const now = new Date();
    const fsrsCard = createEmptyCard<FSRSCard>(now);

    const item: SpacedRepetitionItem = {
      id,
      type: CardType.BASIC,
      content,
      state: CardState.NEW,
      iteration: 0,
      metadata: {}, // will be filled by syncFromFSRSCard
    };

    this.cardMap.set(id, fsrsCard);
    this.syncFromFSRSCard(item, fsrsCard);

    return item;
  }

  public scheduleReview(item: SpacedRepetitionItem): void {
    let fsrsCard = this.cardMap.get(item.id);
    if (!fsrsCard) {
      fsrsCard = createEmptyCard<FSRSCard>(item.nextReviewDate ?? new Date());
      this.syncToFSRSCard(item, fsrsCard);
      this.cardMap.set(item.id, fsrsCard);
    }

    item.nextReviewDate = fsrsCard.due;
    this.addToQueueIfDueToday(item);
  }

  public updateItemAfterReview(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): void {
    const fsrsCard = this.cardMap.get(item.id);
    if (!fsrsCard) {
      console.warn(`FSRS card not found for item ${item.id}...`);
      return;
    }

    const now = new Date();
    const scheduling = this.fsrs.repeat(fsrsCard, now);
    const rating = this.mapPerformanceResponse(performanceResponse);
    const updatedCard = scheduling[rating].card;

    this.cardMap.set(item.id, updatedCard);
    this.syncFromFSRSCard(item, updatedCard);
    item.lastReviewDate = now;
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

  public setParameters(parameters: FSRSConfigInput): void {
    super.setParameters(FSRSAlgorithm.normalizeParameters(parameters));
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

  public removeItem(item: SpacedRepetitionItem): void {
    super.removeItem(item);
    this.cardMap.delete(item.id);
  }

  private syncFromFSRSCard(
    item: SpacedRepetitionItem,
    fsrsCard: FSRSCard,
  ): void {
    if (fsrsCard.last_review) {
      item.lastReviewDate = fsrsCard.last_review;
    }

    item.nextReviewDate = fsrsCard.due;
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

  private syncToFSRSCard(item: SpacedRepetitionItem, fsrsCard: FSRSCard): void {
    fsrsCard.stability = item.metadata.stability ?? 0;
    fsrsCard.difficulty = item.metadata.difficulty ?? 0;
    fsrsCard.scheduled_days = item.metadata.scheduled_days ?? 0;
    fsrsCard.learning_steps = item.metadata.learning_steps ?? 0;
    fsrsCard.reps = item.metadata.reps ?? 0;
    fsrsCard.lapses = item.metadata.lapses ?? 0;
    fsrsCard.state = this.mapStateToFSRS(item.state);
    fsrsCard.due = item.nextReviewDate ?? new Date();
    fsrsCard.last_review = item.lastReviewDate;
  }

  private mapStateFromFSRS(fsrsState: number): CardState {
    return FSRSAlgorithm.STATE_MAP[fsrsState]?.[0] ?? CardState.NEW;
  }

  private mapStateToFSRS(cardState: CardState): State {
    return FSRSAlgorithm.STATE_MAP[cardState]?.[1] ?? State.New;
  }

  /**
   * Normalizes FSRS parameters to the snake_case keys expected by `ts-fsrs`.
   *
   * App settings are stored in camelCase (e.g. `requestRetention`), while
   * `ts-fsrs` only reads snake_case fields (e.g. `request_retention`). This
   * adapter accepts both formats and returns a partial object containing only
   * defined snake_case values so runtime overrides are applied correctly.
   *
   * @param parameters Raw FSRS parameters from settings or callers.
   * @returns A partial parameter object using `ts-fsrs` snake_case keys only.
   */
  private static normalizeParameters(
    parameters: FSRSConfigInput,
  ): Partial<FSRSParameters> {
    const params = parameters;

    const normalized: Partial<FSRSParameters> = {};

    const set = <K extends keyof FSRSParameters>(
      key: K,
      value: FSRSParameters[K] | undefined,
    ) => {
      if (value !== undefined) normalized[key] = value;
    };

    set('w', params.w);
    set(
      'request_retention',
      params.request_retention ?? params.requestRetention,
    );
    set('maximum_interval', params.maximum_interval ?? params.maximumInterval);
    set(
      'learning_steps',
      params.learning_steps ?? params.learningSteps ?? undefined,
    );
    set(
      'relearning_steps',
      params.relearning_steps ?? params.relearningSteps ?? undefined,
    );
    set('enable_fuzz', params.enable_fuzz ?? params.enableFuzz);
    set(
      'enable_short_term',
      params.enable_short_term ?? params.enableShortTerm,
    );

    return normalized;
  }
}
