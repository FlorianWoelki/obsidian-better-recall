import { Vault } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { JsonFileManager } from '../json';
import { join } from 'path';

const DECKS_PATH = 'decks';

export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  items: any[];
  settings: any;
}

export class DecksManager {
  protected jsonFileManager: JsonFileManager;
  private decks: Record<string, Deck>;

  constructor(vault: Vault, pluginId: string) {
    this.jsonFileManager = new JsonFileManager(vault, pluginId);
    this.decks = {};
  }

  public async load(): Promise<void> {
    // Creates decks directory, if it does not already exist.
    await this.jsonFileManager.createDirectory(DECKS_PATH);

    const existingDecks =
      await this.jsonFileManager.readAllJsonFilesInDirectory(DECKS_PATH);

    Object.entries(existingDecks).forEach(([deckName, value]) => {
      this.decks[deckName] = value;
    });
  }

  public async create(deckName: string, description: string): Promise<void> {
    deckName = deckName.trim();
    if (!this.isValidFileName(deckName)) {
      throw new Error(`Invalid deck name: ${deckName}`);
    }

    if (deckName in this.decks) {
      throw new Error(`Deck name already exists: ${deckName}`);
    }

    const deckData: Deck = {
      id: uuidv4(),
      name: deckName,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      settings: {},
    };
    this.decks[deckName] = deckData;

    await this.jsonFileManager.createJsonFile(
      join(DECKS_PATH, `${deckName}.json`),
      deckData,
    );
  }

  public async delete(deckName: string): Promise<void> {
    if (!(deckName in this.decks)) {
      throw new Error(`Deck name does not exist: ${deckName}`);
    }

    delete this.decks[deckName];
    await this.jsonFileManager.deleteJsonFile(
      join(DECKS_PATH, `${deckName}.json`),
    );
  }

  private isValidFileName(fileName: string): boolean {
    if (!fileName) {
      return false;
    }

    const maxLength = 255;
    if (fileName.length > maxLength) {
      return false;
    }

    // eslint-disable-next-line
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(fileName)) {
      return false;
    }

    if (fileName.endsWith('.')) {
      return false;
    }

    return true;
  }
}
