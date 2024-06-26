export interface SpacedRepetitionItem {
  id: string;
  content: string;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  easeFactor: number;
  interval: number;
  iteration: number;
}

export abstract class SpacedRepetitionAlgorithm {
  protected items: Array<SpacedRepetitionItem>;

  constructor() {
    this.items = [];
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

  public async runReviewSession(
    maxItems = 10,
    reviewItem: (item: SpacedRepetitionItem) => Promise<number>,
  ): Promise<void> {
    let reviewedCount = 0;
    while (reviewedCount < maxItems) {
      const item = this.getNextReviewItem();
      if (!item) {
        // No more items to review.
        break;
      }

      try {
        const performance = await reviewItem(item);
        this.updateItemAfterReview(item, performance);
        reviewedCount++;
      } catch (error) {
        console.error('Error reviewing item:', error);
        break;
      }
    }
  }
}
