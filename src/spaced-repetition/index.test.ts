import { vi, describe, expect, it, beforeEach } from 'vitest';
import {
  CardState,
  CardType,
  PerformanceResponse,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '.';

class TestAlgorithm extends SpacedRepetitionAlgorithm<unknown> {
  getDefaultValues() {
    return {};
  }
  scheduleReview() {}
  getNextReviewItem() {
    return null;
  }
  updateItemAfterReview() {}
  mapPerformanceResponse(performanceResponse: PerformanceResponse): number {
    return 0;
  }
  calculatePotentialNextReviewDate(
    item: SpacedRepetitionItem,
    performanceResponse: PerformanceResponse,
  ): Date {
    return new Date();
  }
  createNewCard(
    id: string,
    content: { front: string; back: string },
  ): SpacedRepetitionItem {
    return {
      id,
      content,
      iteration: 0,
      state: CardState.NEW,
      type: CardType.BASIC,
      metadata: {},
    };
  }
}

let algorithm: TestAlgorithm;
let mockItem: SpacedRepetitionItem;

beforeEach(() => {
  vi.clearAllMocks();
  algorithm = new TestAlgorithm();
  mockItem = {
    id: '1',
    type: CardType.BASIC,
    iteration: 0,
    state: CardState.NEW,
    content: { front: 'Front', back: 'Back' },
    metadata: { customField: 'value', priority: 1 },
  };
});

describe('addItem', () => {
  it('should add an item to the items array', () => {
    algorithm.addItem(mockItem);
    expect(algorithm['items']).toContain(mockItem);
  });

  it('should call `scheduleReview` for the added item', () => {
    const spy = vi.spyOn(algorithm, 'scheduleReview');
    algorithm.addItem(mockItem);
    expect(spy).toHaveBeenCalledWith(mockItem);
  });
});

describe('removeItem', () => {
  it('should remove an item from the items array', () => {
    algorithm.addItem(mockItem);
    algorithm.removeItem(mockItem);
    expect(algorithm['items']).not.toContain(mockItem);
  });

  it('should not modify the array if the item is not found', () => {
    algorithm.addItem(mockItem);
    const nonExistentItem = { ...mockItem, id: '2' };
    algorithm.removeItem(nonExistentItem);
    expect(algorithm['items'].length).toBe(1);
  });
});

describe('startNewSession', () => {
  it('should reset session end time and clear queued items', () => {
    const now = new Date();
    algorithm['queuedItems'] = [mockItem];
    algorithm.startNewSession();
    expect(algorithm['sessionEndTime'].toDateString()).toBe(
      algorithm['getEndOfDay'](now).toDateString(),
    );
    expect(algorithm['queuedItems']).toEqual([]);
  });

  it('should call `refreshQueue`', () => {
    const spy = vi.spyOn(algorithm, 'refreshQueue' as keyof TestAlgorithm);
    algorithm.startNewSession();
    expect(spy).toHaveBeenCalled();
  });
});

describe('isDueToday', () => {
  it('should return true for new items', () => {
    expect(algorithm.isDueToday(mockItem)).toBe(true);
  });

  it('should return true for items due today', () => {
    const dueItem = {
      ...mockItem,
      state: CardState.REVIEW,
      nextReviewDate: new Date(),
    };
    expect(algorithm.isDueToday(dueItem)).toBe(true);
  });

  it('should return false for items due in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const notDueItem = {
      ...mockItem,
      state: CardState.REVIEW,
      nextReviewDate: futureDate,
    };
    expect(algorithm.isDueToday(notDueItem)).toBe(false);
  });
});

describe('resetItems', () => {
  it('should reset the items data', () => {
    algorithm.addItem(mockItem);
    algorithm.resetItems();
    expect(algorithm['items']).toHaveLength(0);
  });
});
