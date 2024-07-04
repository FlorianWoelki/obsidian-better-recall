import { expect, vi, it, describe, beforeEach } from 'vitest';
import { Vault } from 'obsidian';
import { DecksManager } from './decks-manager';
import { SpacedRepetitionAlgorithm } from 'src/spaced-repetition';
import { JsonFileManager } from '../json';

const mocks = vi.hoisted(() => ({
  vault: {} as Vault,
  jsonFileManager: {
    writeJsonFile: vi.fn(),
    createJsonFile: vi.fn(),
    readJsonFile: vi.fn(),
    exists: vi.fn(),
  },
}));

vi.mock('obsidian', async () => {
  const actual = await vi.importActual('obsidian');
  return { ...actual, normalizePath: vi.fn(() => '') };
});

describe('DecksManager', () => {
  let decksManager: DecksManager;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockAlgorithm = {} as SpacedRepetitionAlgorithm<unknown>;
    decksManager = new DecksManager(mocks.vault, mockAlgorithm, 'testPluginId');
    decksManager['jsonFileManager'] =
      mocks.jsonFileManager as unknown as JsonFileManager;
  });

  describe('load', () => {
    it('should create a new file if it does not exist', async () => {
      mocks.jsonFileManager.exists.mockResolvedValue(false);
      await decksManager.load();
      expect(mocks.jsonFileManager.createJsonFile).toHaveBeenCalledWith(
        'decks.json',
      );
    });

    it('should load existing decks', async () => {
      mocks.jsonFileManager.exists.mockResolvedValue(true);
      mocks.jsonFileManager.readJsonFile.mockResolvedValue({
        decks: [
          { id: 'deck1', name: 'Deck 1', description: 'Test deck', cards: {} },
        ],
      });
      await decksManager.load();
      expect(decksManager.getDecks()).toHaveProperty('deck1');
    });
  });

  // describe('create', () => {});

  // describe('updateInformation', () => {});

  // describe('addCard', () => {});

  // describe('updateCardContent', () => {});

  // describe('removeCard', () => {});

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
});
