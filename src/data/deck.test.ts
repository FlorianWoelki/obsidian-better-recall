import {
  CardState,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '../spaced-repetition';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import {
  CardJsonStructure,
  Deck,
  DeckJsonStructure,
  jsonObjectToDeck,
} from './deck';

vi.mock('uuid', async () => {
  const actual = await vi.importActual('uuid');
  return {
    ...actual,
    v4: vi.fn(() => 'mocked-uuid'),
  };
});

describe('Deck', () => {
  let mockAlgorithm: SpacedRepetitionAlgorithm<unknown>;

  beforeEach(() => {
    mockAlgorithm = {
      isDueToday: vi.fn(),
    } as unknown as SpacedRepetitionAlgorithm<unknown>;
    vi.useFakeTimers().setSystemTime(new Date('2024-07-04'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('`constructor` should create a deck with default values', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    expect(deck.id).toBe('mocked-uuid');
    expect(deck.getName()).toBe('Test Deck');
    expect(deck.getDescription()).toBe('Test Description');
    expect(deck.createdAt).toEqual(new Date('2024-07-04'));
    expect(deck.updatedAt).toEqual(new Date('2024-07-04'));
    expect(deck.cards).toEqual({});
  });

  it('`toJsonObject` should return correct JSON structure', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    const jsonObject = deck.toJsonObject();
    expect(jsonObject).toStrictEqual({
      id: 'mocked-uuid',
      name: 'Test Deck',
      description: 'Test Description',
      createdAt: 'Thu Jul 04 2024',
      updatedAt: 'Thu Jul 04 2024',
      cards: {},
    });
  });

  it('cardsArray should return an array of cards', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    const card1 = { id: '1', state: CardState.NEW };
    const card2 = { id: '2', state: CardState.REVIEW };
    deck.cards['1'] = card1 as SpacedRepetitionItem;
    deck.cards['2'] = card2 as SpacedRepetitionItem;
    expect(deck.cardsArray).toEqual([card1, card2]);
  });

  it('learnCards should return cards in LEARNING or RELEARNING state', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    const card1 = { id: '1', state: CardState.LEARNING };
    const card2 = {
      id: '2',
      state: CardState.RELEARNING,
    };
    const card3 = { id: '3', state: CardState.NEW };
    deck.cards['1'] = card1 as SpacedRepetitionItem;
    deck.cards['2'] = card2 as SpacedRepetitionItem;
    deck.cards['3'] = card3 as SpacedRepetitionItem;
    expect(deck.learnCards).toEqual([card1, card2]);
  });

  it('dueCards should return due REVIEW cards', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    const card1 = { id: '1', state: CardState.REVIEW };
    const card2 = { id: '2', state: CardState.REVIEW };
    deck.cards['1'] = card1 as SpacedRepetitionItem;
    deck.cards['2'] = card2 as SpacedRepetitionItem;
    (mockAlgorithm.isDueToday as Mock)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    expect(deck.dueCards).toEqual([card1]);
  });

  it('newCards should return cards in NEW state', () => {
    const deck = new Deck(mockAlgorithm, 'Test Deck', 'Test Description');
    const card1 = { id: '1', state: CardState.NEW };
    const card2 = { id: '2', state: CardState.REVIEW };
    deck.cards['1'] = card1 as SpacedRepetitionItem;
    deck.cards['2'] = card2 as SpacedRepetitionItem;
    expect(deck.newCards).toEqual([card1]);
  });
});

describe('jsonObjectToDeck', () => {
  let mockAlgorithm: SpacedRepetitionAlgorithm<unknown>;

  beforeEach(() => {
    mockAlgorithm = {} as SpacedRepetitionAlgorithm<unknown>;
  });

  it('should convert JSON object to Deck', () => {
    const jsonObject: DeckJsonStructure = {
      id: 'test-id',
      name: 'Test Deck',
      description: 'Test Description',
      createdAt: '2024-07-04T00:00:00.000Z',
      updatedAt: '2024-07-04T00:00:00.000Z',
      cards: {
        '1': {
          state: CardState.NEW,
          lastReviewDate: new Date(),
          nextReviewDate: new Date(),
        } as unknown as CardJsonStructure,
      },
    };

    const deck = jsonObjectToDeck(mockAlgorithm, jsonObject);

    expect(deck.id).toBe('test-id');
    expect(deck.getName()).toBe('Test Deck');
    expect(deck.getDescription()).toBe('Test Description');
    expect(deck.createdAt).toEqual(new Date('2024-07-04T00:00:00.000Z'));
    expect(deck.updatedAt).toEqual(new Date('2024-07-04T00:00:00.000Z'));
    expect(deck.cards['1']).toEqual({
      id: '1',
      state: CardState.NEW,
      lastReviewDate: new Date(),
      nextReviewDate: new Date(),
    });
  });
});
