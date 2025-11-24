import { expect, vi, it, describe, beforeEach } from 'vitest';
import { DecksManager } from './decks-manager';
import {
  CardState,
  CardType,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '../../spaced-repetition';
import { Deck } from '../deck';
import BetterRecallPlugin from 'src/main';

const mocks = vi.hoisted(() => ({
  plugin: {
    savePluginData: vi.fn(),
    getData: vi.fn(() => ({
      decks: [
        { id: 'deck1', name: 'Deck 1', description: 'Test deck', cards: {} },
      ],
    })),
  },
}));

vi.mock('obsidian', async () => {
  const actual = await vi.importActual('obsidian');
  return { ...actual, normalizePath: vi.fn(() => '') };
});

describe('DecksManager', () => {
  let decksManager: DecksManager;
  let mockAlgorithm = {} as SpacedRepetitionAlgorithm<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAlgorithm.createNewCard = vi.fn().mockImplementation((id, content) => ({
      id,
      type: CardType.BASIC,
      content,
      state: CardState.NEW,
      iteration: 0,
      lastReviewDate: undefined,
      nextReviewDate: undefined,
      metadata: {},
    }));
    decksManager = new DecksManager(
      mocks.plugin as unknown as BetterRecallPlugin,
      mockAlgorithm,
    );
  });

  describe('load', () => {
    it('should load existing decks', async () => {
      await decksManager.load();
      expect(decksManager.getDecks()).toHaveProperty('deck1');
    });
  });

  describe('create', () => {
    it('should create a new deck', async () => {
      const spy = vi.spyOn(decksManager, 'save').mockResolvedValue();
      const deck = await decksManager.create('New Deck', 'New Description');
      expect(deck).toBeInstanceOf(Deck);
      expect(spy).toHaveBeenCalled();
    });

    it('should throw an error for invalid deck name', async () => {
      await expect(decksManager.create('Invalid/Name', 'Test')).rejects.toThrow(
        'Invalid deck name',
      );
    });

    it('should throw an error for existing deck name', async () => {
      await decksManager.create('Existing Deck', 'Test');
      await expect(
        decksManager.create('Existing Deck', 'Test'),
      ).rejects.toThrow('Deck name already exists');
    });
  });

  describe('updateInformation', () => {
    it('should update deck information', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      const updatedDeck = await decksManager.updateInformation(
        deck.id,
        'Updated Deck',
        'Updated Description',
      );
      expect(updatedDeck.getName()).toBe('Updated Deck');
      expect(updatedDeck.getDescription()).toBe('Updated Description');
    });

    it('should throw an error for non-existent deck', async () => {
      await expect(
        decksManager.updateInformation(
          'nonexistent',
          'New Name',
          'New Description',
        ),
      ).rejects.toThrow('Deck with id does not exist');
    });
  });

  describe('addCard', () => {
    it('should add a card to a deck', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      const card = {
        id: 'card1',
        content: { front: 'Hello', back: 'World' },
      } as SpacedRepetitionItem;
      decksManager.addCard(deck.id, card);
      expect(deck.cards).toHaveProperty('card1');
    });

    it('should throw an error for non-existent deck', () => {
      const card = {
        id: 'card1',
        content: { front: 'Hello', back: 'World' },
      } as SpacedRepetitionItem;
      expect(() => decksManager.addCard('nonexistent', card)).toThrow(
        'No deck with id found',
      );
    });
  });

  describe('updateCardContent', () => {
    it('should update card content', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      const card = {
        id: 'card1',
        content: { front: 'Hello', back: 'World' },
      } as SpacedRepetitionItem;
      decksManager.addCard(deck.id, card);
      const updatedCard = {
        id: 'card1',
        content: { front: 'foo', back: 'foo' },
      } as SpacedRepetitionItem;
      decksManager.updateCardContent(deck.id, updatedCard);
      expect(deck.cards['card1'].content.front).toBe('foo');
      expect(deck.cards['card1'].content.back).toBe('foo');
    });

    it('should throw an error for non-existent card', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      const updatedCard = {
        id: 'card1',
        content: { front: 'foo', back: 'foo' },
      } as SpacedRepetitionItem;
      expect(() =>
        decksManager.updateCardContent(deck.id, updatedCard),
      ).toThrow(`No card in deck with card id found: ${updatedCard.id}`);
    });
  });

  describe('removeCard', () => {
    it('should remove a card from a deck', async () => {
      const deck = await decksManager.create('Test deck', 'Test Description');
      const card = {
        id: 'card1',
        content: { front: 'Hello', back: 'World' },
      } as SpacedRepetitionItem;
      decksManager.addCard(deck.id, card);
      decksManager.removeCard(deck.id, 'card1');
      expect(deck.cards).not.toHaveProperty('card1');
    });

    it('should throw an error for non-existent card', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      expect(() => decksManager.removeCard(deck.id, 'nonexistent')).toThrow(
        'No card in deck with card id found',
      );
    });
  });

  describe('delete', () => {
    it('should delete a deck', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');
      await decksManager.delete(deck.id);
      expect(decksManager.getDecks()).not.toHaveProperty(deck.id);
    });

    it('should throw an error for non-existent deck', async () => {
      await expect(decksManager.delete('nonexistent')).rejects.toThrow(
        'Deck name does not exist',
      );
    });
  });

  describe('resetCardsForAlgorithmSwitch', () => {
    it('should reset all cards to NEW state when switching algorithms', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');

      const card1 = {
        id: 'card1',
        type: CardType.BASIC,
        content: { front: 'Hello', back: 'World' },
        state: CardState.REVIEW,
        iteration: 5,
        lastReviewDate: new Date('2023-01-01'),
        nextReviewDate: new Date('2023-12-31'),
        metadata: {
          easeFactor: 2.5,
          interval: 30,
          stepIndex: 2,
        },
      };

      const card2 = {
        id: 'card2',
        type: CardType.BASIC,
        content: { front: 'Foo', back: 'Bar' },
        state: CardState.LEARNING,
        iteration: 2,
        lastReviewDate: new Date('2023-02-01'),
        nextReviewDate: new Date('2023-12-30'),
        metadata: {
          stability: 10,
          difficulty: 0.5,
        },
      };

      decksManager.addCard(deck.id, card1);
      decksManager.addCard(deck.id, card2);

      await decksManager.resetCardsForAlgorithmSwitch();

      const updatedDeck = decksManager.getDecks()[deck.id];
      const cards = Object.values(updatedDeck.cards);

      expect(cards).toHaveLength(2);

      const resetCard1 = cards.find((c) => c.id === 'card1');
      expect(resetCard1).toBeDefined();
      expect(resetCard1?.state).toBe(CardState.NEW);
      expect(resetCard1?.iteration).toBe(0);
      expect(resetCard1?.lastReviewDate).toBeUndefined();
      expect(resetCard1?.nextReviewDate).toBeUndefined();
      expect(resetCard1?.metadata).toEqual({});
      expect(resetCard1?.content).toEqual({ front: 'Hello', back: 'World' });

      const resetCard2 = cards.find((c) => c.id === 'card2');
      expect(resetCard2).toBeDefined();
      expect(resetCard2?.state).toBe(CardState.NEW);
      expect(resetCard2?.iteration).toBe(0);
      expect(resetCard2?.lastReviewDate).toBeUndefined();
      expect(resetCard2?.nextReviewDate).toBeUndefined();
      expect(resetCard2?.metadata).toEqual({});
      expect(resetCard2?.content).toEqual({ front: 'Foo', back: 'Bar' });

      expect(mockAlgorithm.createNewCard).toHaveBeenCalledTimes(2);
      expect(mockAlgorithm.createNewCard).toHaveBeenCalledWith('card1', {
        front: 'Hello',
        back: 'World',
      });
      expect(mockAlgorithm.createNewCard).toHaveBeenCalledWith('card2', {
        front: 'Foo',
        back: 'Bar',
      });
    });

    it('should call save method after resetting cards', async () => {
      const deck = await decksManager.create('Test Deck', 'Test Description');

      const card = {
        id: 'card1',
        type: 0,
        content: { front: 'Hello', back: 'World' },
        state: 2,
        iteration: 5,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(),
        metadata: { easeFactor: 2.5 },
      };

      decksManager.addCard(deck.id, card);

      const saveSpy = vi.spyOn(decksManager, 'save').mockResolvedValue();

      await decksManager.resetCardsForAlgorithmSwitch();

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty decks gracefully', async () => {
      const saveSpy = vi.spyOn(decksManager, 'save').mockResolvedValue();

      await decksManager.resetCardsForAlgorithmSwitch();

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
