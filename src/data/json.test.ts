import type { Vault } from 'obsidian';
import { vi, describe, expect, it, beforeEach, Mocked } from 'vitest';
import { JsonFileManager } from './json';
import { join } from 'path';

const mocks = vi.hoisted(() => ({
  adapterExists: vi.fn(),
  adapterTrashLocal: vi.fn(),
  adapterRead: vi.fn(),
  adapterWrite: vi.fn(),
}));

vi.mock('obsidian', async () => {
  const actual = await vi.importActual('obsidian');
  return { ...actual, normalizePath: vi.fn((path) => path) };
});

describe('JsonFileManager', () => {
  let jsonFileManager: JsonFileManager;
  let mockVault: Mocked<Vault>;

  beforeEach(() => {
    mockVault = {
      createFolder: vi.fn(),
      adapter: {
        exists: mocks.adapterExists,
        trashLocal: mocks.adapterTrashLocal,
        write: mocks.adapterWrite,
        read: mocks.adapterRead,
      },
    } as unknown as Mocked<Vault>;
    jsonFileManager = new JsonFileManager(mockVault, 'test-plugin');
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file', async () => {
      const mockData = { key: 'value' };
      mocks.adapterRead.mockResolvedValue(JSON.stringify(mockData));

      const result = await jsonFileManager.readJsonFile('test.json');

      expect(result).toEqual(mockData);
      expect(mocks.adapterRead).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
      );
    });
  });

  describe('writeJsonFile', () => {
    it('should write data to JSON file', async () => {
      const mockData = { key: 'value' };

      await jsonFileManager.writeJsonFile('test.json', mockData);

      expect(mocks.adapterWrite).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
        JSON.stringify(mockData),
      );
    });
  });

  describe('createJsonFile', () => {
    it('should create a new JSON file with initial data', async () => {
      const mockData = { key: 'value' };

      await jsonFileManager.createJsonFile('test.json', mockData);

      expect(mocks.adapterWrite).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
        JSON.stringify(mockData),
      );
    });

    it('should create a new JSON file with empty object if no initial data provided', async () => {
      await jsonFileManager.createJsonFile('test.json');
      expect(mocks.adapterWrite).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
        '{}',
      );
    });
  });

  describe('deleteJsonFile', () => {
    it('should delete a JSON file', async () => {
      await jsonFileManager.deleteJsonFile('test.json');

      expect(mocks.adapterTrashLocal).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
      );
    });
  });

  describe('exists', () => {
    it('should check if a file exists', async () => {
      mocks.adapterExists.mockResolvedValue(true);

      const result = await jsonFileManager.exists('test.json');

      expect(result).toBe(true);
      expect(mockVault.adapter.exists).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'test.json'),
      );
    });
  });

  describe('createDirectory', () => {
    it('should create a directory if it does not exist', async () => {
      mocks.adapterExists.mockResolvedValue(false);

      await jsonFileManager.createDirectory('testDir');

      expect(mockVault.createFolder).toHaveBeenCalledWith(
        join('.obsidian', 'plugins', 'test-plugin', 'testDir'),
      );
    });

    it('should not create a directory if it already exists', async () => {
      mocks.adapterExists.mockResolvedValue(true);

      await jsonFileManager.createDirectory('testDir');

      expect(mockVault.createFolder).not.toHaveBeenCalled();
    });
  });
});
