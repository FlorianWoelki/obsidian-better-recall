import { beforeEach, describe, expect, it, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { FSRSAlgorithm } from './fsrs';
import {
  CardState,
  CardType,
  PerformanceResponse,
  SpacedRepetitionItem,
} from '.';

let fsrsAlgo: FSRSAlgorithm;

function createSpacedRepetitionItem(content: string): SpacedRepetitionItem {
  return {
    id: uuidv4(),
    content: { front: content, back: content },
    type: CardType.BASIC,
    easeFactor: 2.5,
    interval: 0,
    iteration: 0,
    state: CardState.NEW,
    stepIndex: 0,
  };
}

beforeEach(() => {
  fsrsAlgo = new FSRSAlgorithm();
  vi.useFakeTimers();
});

describe('getNextReviewItem', () => {
  it('should return `null` when no items are due', () => {
    fsrsAlgo.startNewSession();
    expect(fsrsAlgo.getNextReviewItem()).toBeNull();
  });

  it('should return a new item when available', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();
    expect(fsrsAlgo.getNextReviewItem()).toStrictEqual(item);
  });

  it('should return a due item when available', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.GOOD);

    const nextReview = reviewItem.nextReviewDate;
    if (nextReview) {
      vi.setSystemTime(nextReview);
      fsrsAlgo.startNewSession();
      expect(fsrsAlgo.getNextReviewItem()).toStrictEqual(item);
    }
  });
});

describe('updateItemAfterReview', () => {
  it('should update item correctly for AGAIN response', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    const beforeIteration = reviewItem.iteration;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.AGAIN);

    expect(reviewItem.state).toBe(CardState.LEARNING);
    expect(reviewItem.iteration).toBe(beforeIteration + 1);
    expect(reviewItem.lastReviewDate).toBeDefined();
    expect(reviewItem.nextReviewDate).toBeDefined();
  });

  it('should update item correctly for GOOD response', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    const beforeIteration = reviewItem.iteration;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.GOOD);

    expect(reviewItem.state).toBe(CardState.LEARNING);
    expect(reviewItem.iteration).toBe(beforeIteration + 1);
    expect(reviewItem.lastReviewDate).toBeDefined();
    expect(reviewItem.nextReviewDate).toBeDefined();
  });

  it('should update item correctly for HARD response', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    const beforeIteration = reviewItem.iteration;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.HARD);

    expect(reviewItem.state).toBe(CardState.LEARNING);
    expect(reviewItem.iteration).toBe(beforeIteration + 1);
    expect(reviewItem.lastReviewDate).toBeDefined();
    expect(reviewItem.nextReviewDate).toBeDefined();
  });

  it('should update item correctly for EASY response', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    const beforeIteration = reviewItem.iteration;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.EASY);

    expect(reviewItem.state).toBe(CardState.REVIEW);
    expect(reviewItem.iteration).toBe(beforeIteration + 1);
    expect(reviewItem.lastReviewDate).toBeDefined();
    expect(reviewItem.nextReviewDate).toBeDefined();
  });
});

describe('startNewSession', () => {
  it('should reset the queue and add all due items', () => {
    const item1 = createSpacedRepetitionItem('Item 1');
    const item2 = createSpacedRepetitionItem('Item 2');
    fsrsAlgo.addItem(item1);
    fsrsAlgo.addItem(item2);
    fsrsAlgo.startNewSession();

    expect(fsrsAlgo.getNextReviewItem()).toStrictEqual(item1);
    expect(fsrsAlgo.getNextReviewItem()).toStrictEqual(item2);
    expect(fsrsAlgo.getNextReviewItem()).toBeNull();
  });
});

describe('queuedItems behavior', () => {
  it('should re-add items to the queue if still due after review', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.AGAIN);

    const nextItem = fsrsAlgo.getNextReviewItem();
    if (nextItem) {
      expect(nextItem.id).toBe(reviewItem.id);
    }
  });

  it('should not re-add items to the queue if not due after review', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;
    fsrsAlgo.updateItemAfterReview(reviewItem, PerformanceResponse.EASY);

    expect(fsrsAlgo.getNextReviewItem()).toBeNull();
  });
});

describe('calculatePotentialNextReviewDate', () => {
  it('should return different dates for different ratings', () => {
    const item = createSpacedRepetitionItem('Test item');
    fsrsAlgo.addItem(item);
    fsrsAlgo.startNewSession();

    const reviewItem = fsrsAlgo.getNextReviewItem() as SpacedRepetitionItem;

    const againDate = fsrsAlgo.calculatePotentialNextReviewDate(
      reviewItem,
      PerformanceResponse.AGAIN,
    );
    const hardDate = fsrsAlgo.calculatePotentialNextReviewDate(
      reviewItem,
      PerformanceResponse.HARD,
    );
    const goodDate = fsrsAlgo.calculatePotentialNextReviewDate(
      reviewItem,
      PerformanceResponse.GOOD,
    );
    const easyDate = fsrsAlgo.calculatePotentialNextReviewDate(
      reviewItem,
      PerformanceResponse.EASY,
    );

    // FSRS typically schedules: Again < Hard < Good < Easy
    expect(againDate.getTime()).toBeLessThanOrEqual(hardDate.getTime());
    expect(hardDate.getTime()).toBeLessThanOrEqual(goodDate.getTime());
    expect(goodDate.getTime()).toBeLessThanOrEqual(easyDate.getTime());
  });
});
