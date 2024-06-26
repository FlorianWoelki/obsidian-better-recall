import { v4 as uuidv4 } from 'uuid';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpacedRepetitionItem } from '.';
import { AnkiAlgorithm, PerformanceResponse } from './anki';

let ankiAlgo: AnkiAlgorithm;

function createSpacedRepetitionItem(content: string): SpacedRepetitionItem {
  return {
    id: uuidv4(),
    content,
    easeFactor: 2.5,
    interval: 0,
    iteration: 0,
  };
}

beforeEach(() => {
  ankiAlgo = new AnkiAlgorithm();
});

describe('getNextReviewItem', () => {
  it('should return `null` when no items are due', () => {
    const item = createSpacedRepetitionItem('Test item');
    ankiAlgo.addItem(item);
    item.nextReviewDate = new Date(Date.now() + 10000);
    expect(ankiAlgo.getNextReviewItem()).toBeNull();
  });

  it('should return an item when it is due', () => {
    const item = createSpacedRepetitionItem('Test item');
    ankiAlgo.addItem(item);
    expect(ankiAlgo.getNextReviewItem()).toStrictEqual(item);
  });
});

describe('updateItemAfterReview', () => {
  it('should update item correctly for AGAIN response', () => {
    const item = createSpacedRepetitionItem('Test item');
    item.easeFactor = 2.5;
    item.interval = 10;
    ankiAlgo.addItem(item);

    ankiAlgo.updateItemAfterReview(item, PerformanceResponse.AGAIN);

    expect(item.easeFactor).toBe(2.3);
    expect(item.interval).toBe(5);
    expect(item.iteration).toBe(1);
  });

  it('should update item correctly for HARD response', () => {
    const item = createSpacedRepetitionItem('Test item');
    item.easeFactor = 2.5;
    item.interval = 10;
    ankiAlgo.addItem(item);

    ankiAlgo.updateItemAfterReview(item, PerformanceResponse.HARD);

    expect(item.easeFactor).toBe(2.35);
    expect(item.interval).toBe(12);
    expect(item.iteration).toBe(1);
  });

  it('should update item correctly for GOOD response', () => {
    const item = createSpacedRepetitionItem('Test item');
    item.easeFactor = 2.5;
    item.interval = 10;
    item.iteration = 2;
    ankiAlgo.addItem(item);

    ankiAlgo.updateItemAfterReview(item, PerformanceResponse.GOOD);

    expect(item.easeFactor).toBe(2.5);
    expect(item.interval).toBe(25);
    expect(item.iteration).toBe(3);
  });

  it('should update item correctly for EASY response', () => {
    const item = createSpacedRepetitionItem('Test item');
    item.easeFactor = 2.5;
    item.interval = 10;
    item.iteration = 2;
    ankiAlgo.addItem(item);

    ankiAlgo.updateItemAfterReview(item, PerformanceResponse.EASY);

    expect(item.easeFactor).toBe(2.65);
    expect(item.interval).toBe(34.449999999999996);
    expect(item.iteration).toBe(3);
  });
});

describe('runReviewSession', () => {
  it('should process due items', async () => {
    for (let i = 0; i < 3; i++) {
      const item = createSpacedRepetitionItem(`Test item ${i}`);
      ankiAlgo.addItem(item);
      item.nextReviewDate = new Date(Date.now() - 1000);
    }

    await ankiAlgo.runReviewSession(3, async () => {
      return Promise.resolve(PerformanceResponse.GOOD);
    });

    ankiAlgo['items'].forEach((item) => {
      expect(item.iteration).toBe(1);
      expect(item.interval).toBe(1);
    });
  });
});
