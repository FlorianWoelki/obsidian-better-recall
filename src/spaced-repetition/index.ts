export enum CardState {
  NEW,
  LEARNING,
  REVIEW,
  RELEARNING,
}

export interface SpacedRepetitionItem {
  id: string;
  content: string;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  easeFactor: number;
  interval: number;
  iteration: number;
  state: CardState;
  stepIndex: number;
}

export abstract class SpacedRepetitionAlgorithm {
  protected items: SpacedRepetitionItem[];
  protected queuedItems: SpacedRepetitionItem[];
  protected sessionEndTime: Date;

  constructor() {
    this.items = [];
    this.queuedItems = [];
    this.sessionEndTime = this.getEndOfDay(new Date());
  }

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
    performanceResponse: number,
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

  public getItemCount(): number {
    return this.items.length;
  }

  public startNewSession(): void {
    this.sessionEndTime = this.getEndOfDay(new Date());
    this.queuedItems = [];
    this.refreshQueue();
  }

  protected addToQueueIfDueToday(item: SpacedRepetitionItem): void {
    if (this.isDueToday(item) && !this.queuedItems.includes(item)) {
      this.queuedItems.push(item);
    }
  }

  protected isDueToday(item: SpacedRepetitionItem): boolean {
    const now = new Date();
    return (
      item.state === CardState.NEW ||
      (!!item.nextReviewDate &&
        item.nextReviewDate <= this.sessionEndTime &&
        item.nextReviewDate >= now)
    );
  }

  protected refreshQueue(): void {
    this.items.forEach((item) => this.addToQueueIfDueToday(item));
  }

  protected getEndOfDay(date: Date): Date {
    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);
    return endOfDate;
  }
}
