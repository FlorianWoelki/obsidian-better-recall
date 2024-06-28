import { Vault } from 'obsidian';
import { JsonFileManager } from '../json';
import { Deck, DecksJsonStructure, jsonObjectToDeck } from '../deck';
import { SpacedRepetitionAlgorithm } from 'src/spaced-repetition';

const DECKS_FILE = 'decks.json';

export class DecksManager {
  protected jsonFileManager: JsonFileManager;
  private decks: Record<string, Deck>;
  private algorithm: SpacedRepetitionAlgorithm<unknown>;

  constructor(
    vault: Vault,
    algorithm: SpacedRepetitionAlgorithm<unknown>,
    pluginId: string,
  ) {
    this.jsonFileManager = new JsonFileManager(vault, pluginId);
    this.decks = {};
    this.algorithm = algorithm;
  }

  public async load(): Promise<void> {
    const decksFileExists = await this.jsonFileManager.exists(DECKS_FILE);
    if (!decksFileExists) {
      await this.jsonFileManager.createJsonFile(DECKS_FILE);
      return;
    }

    const data =
      await this.jsonFileManager.readJsonFile<DecksJsonStructure>(DECKS_FILE);
    if (!data.decks) {
      return;
    }

    data.decks.forEach((deck) => {
      this.decks[deck.name] = jsonObjectToDeck(this.algorithm, deck);
    });
  }

  public async create(deckName: string, description: string): Promise<Deck> {
    deckName = deckName.trim();
    if (!this.isValidFileName(deckName)) {
      throw new Error(`Invalid deck name: ${deckName}`);
    }

    if (deckName in this.decks) {
      throw new Error(`Deck name already exists: ${deckName}`);
    }

    const deckData = new Deck(this.algorithm, deckName, description);
    this.decks[deckName] = deckData;

    await this.jsonFileManager.writeJsonFile(
      DECKS_FILE,
      this.toJsonStructure(),
    );
    return deckData;
  }

  public async save(): Promise<void> {
    // TODO
  }

  public async delete(deckName: string): Promise<void> {
    if (!(deckName in this.decks)) {
      throw new Error(`Deck name does not exist: ${deckName}`);
    }

    delete this.decks[deckName];
    await this.jsonFileManager.writeJsonFile<DecksJsonStructure>(
      DECKS_FILE,
      this.toJsonStructure(),
    );
  }

  public get decksArray(): Deck[] {
    // Drops the keys because we don't necessarily need them.
    return Object.values(this.decks);
  }

  public getDecks(): Record<string, Deck> {
    return this.decks;
  }

  private toJsonStructure(): DecksJsonStructure {
    const decks = this.decksArray.map((deck) => deck.toJsonObject());
    return { decks };
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
