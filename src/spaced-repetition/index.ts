export enum PerformanceResponse {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

export enum CardState {
  NEW,
  LEARNING,
  REVIEW,
  RELEARNING,
}

export enum CardType {
  BASIC,
}

export interface ISpacedRepetitionItem {
  id: string;
  type: CardType;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  easeFactor: number;
  interval: number;
  iteration: number;
  state: CardState;
  stepIndex: number;
  metadata?: Record<string, any>;
}

export interface BasicSpacedRepetitionItem extends ISpacedRepetitionItem {
  type: CardType.BASIC;
  content: {
    front: string;
    back: string;
  };
}

export type SpacedRepetitionItem = BasicSpacedRepetitionItem;

export abstract class SpacedRepetitionAlgorithm<T> {
  protected items: SpacedRepetitionItem[];
  protected queuedItems: SpacedRepetitionItem[];
  protected sessionEndTime: Date;

  protected parameters: T;

  constructor(parameters: Partial<T> = {}) {
    this.items = [];
    this.queuedItems = [];
    this.sessionEndTime = this.getEndOfDay(new Date());

    this.parameters = {
      ...this.getDefaultValues(),
      parameters,
    };
  }

  /**
   * Returns the default values for the algorithm.
   * @returns An object which contains the default values for the algorithm.
   */
  public abstract getDefaultValues(): T;

  /**
   * Schedules the next review for a given item.
   * This method should implement the algorithm's logic for determining
   * when the item should next be reviewed based on its current state.
   * @param item The item to schedule for review.
   */
  public abstract scheduleReview(item: SpacedRepetitionItem): void;

  /**
   * Retrieves the next item that is due for review.
   * This method should implement the algorithm's logic for selecting
   * which item should be reviewed next, typically based on review dates
   * and priority.
   * @returns The next item due for review, or `null` if no items are due.
   */
  public abstract getNextReviewItem(): SpacedRepetitionItem | null;

  /**
   * Tries to map the general performance response to the specific rating
   * of the algorithm. The rating of the algorithm should be defined in the
   * implementation.
   * @param performanceResponse The performance response that will be mapped
   * to the algorithm's value.
   */
  public abstract mapPerformanceResponse(
    performanceResponse: PerformanceResponse,
  ): number;

  /**
   * Calculates the potential next review date for an item based on a performance
   * response.
   * This method should simulate the scheduling algorithm without modifying the actual
   * item state, allowing callers to preview when the next review would be scheduled
   * given a specific performance rating.
   * @param item The item to calculate the next review date for.
   * @param performanceResponse The user's performance response.
   * @returns The calculated next review date.
   */
  public abstract calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date;

  /**
   * Updates an item's state after it has been reviewed.
   * This method should implement the algorithm's logic for adjusting
   * the item's properties (such as interval or ease factor) based on
   * the user's performance during the review.
   * @param item the Item that was reviewed.
   * @param performanceResponse A measure of how well the user performed
   * on the review typically represented as a number or enum.
   */
  public abstract updateItemAfterReview(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): void;

  public addItem(item: SpacedRepetitionItem): void {
    this.items.push(item);
    this.scheduleReview(item);
  }

  public removeItem(item: SpacedRepetitionItem): void {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  public setParameters(parameters: Partial<T>): void {
    this.parameters = {
      ...this.parameters,
      ...parameters,
    };
  }

  public getItemCount(): number {
    return this.items.length;
  }

  public getParameters(): T {
    return this.parameters;
  }

  public resetItems(): void {
    this.items = [];
  }

  /**
   * Starts a new review session.
   * This function resets the session end time to the end of the current day,
   * clears the queue of items to be reviewed, and refreshes the queue with
   * items due for review today.
   */
  public startNewSession(): void {
    this.sessionEndTime = this.getEndOfDay(new Date());
    this.queuedItems = [];
    this.refreshQueue();
  }

  /**
   * Adds an item to the queue if it is due for review today.
   * @param item The item to potentially add to the queue.
   */
  protected addToQueueIfDueToday(item: SpacedRepetitionItem): void {
    if (this.isDueToday(item) && !this.queuedItems.includes(item)) {
      this.queuedItems.push(item);
    }
  }

  /**
   * Checks if an item is due for review today.
   * @param item The item to check.
   * @returns True if the item is due today, false otherwise.
   */
  public isDueToday(item: SpacedRepetitionItem): boolean {
    const now = new Date();
    return (
      item.state === CardState.NEW ||
      (!!item.nextReviewDate &&
        item.nextReviewDate <= this.sessionEndTime &&
        item.nextReviewDate?.toDateString() === now.toDateString())
    );
  }

  /**
   * Refreshes the queue of items to be reviewed.
   * This method checks all items and adds those due for review today
   * to the queue.
   */
  protected refreshQueue(): void {
    this.items.forEach((item) => this.addToQueueIfDueToday(item));
  }

  protected getEndOfDay(date: Date): Date {
    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);
    return endOfDate;
  }
}
