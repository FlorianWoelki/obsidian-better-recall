import { Vault } from 'obsidian';
import { JsonFileManager } from '../json';
import { Deck, DecksJsonStructure, jsonObjectToDeck } from '../deck';
import {
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from 'src/spaced-repetition';

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
      this.decks[deck.id] = jsonObjectToDeck(this.algorithm, deck);
    });
  }

  public async create(deckName: string, description: string): Promise<Deck> {
    deckName = deckName.trim();
    if (!this.isValidFileName(deckName)) {
      throw new Error(`Invalid deck name: ${deckName}`);
    }

    if (this.decksArray.find((deck) => deck.getName() === deckName)) {
      throw new Error(`Deck name already exists: ${deckName}`);
    }

    const deckData = new Deck(this.algorithm, deckName, description);
    this.decks[deckData.id] = deckData;

    await this.save();
    return deckData;
  }

  public async updateInformation(
    id: string,
    newName: string,
    newDescription: string,
  ): Promise<Deck> {
    newName = newName.trim();
    if (!this.isValidFileName(newName)) {
      throw new Error(`Invalid deck name: ${newName}`);
    }

    if (!(id in this.decks)) {
      throw new Error(`Deck with ID does not exist: ${id}`);
    }

    this.decks[id].setName(newName);
    this.decks[id].setDescription(newDescription);
    await this.save();
    return this.decks[id];
  }

  public addCard(deckId: string, card: SpacedRepetitionItem): void {
    if (!(deckId in this.decks)) {
      throw new Error(`No deck with id found: ${deckId}`);
    }
    this.decks[deckId].cards[card.id] = card;
  }

  public updateCardContent(
    deckId: string,
    updatedCard: SpacedRepetitionItem,
  ): void {
    if (!(deckId in this.decks)) {
      throw new Error(`No deck with id found: ${deckId}`);
    }

    if (!(updatedCard.id in this.decks[deckId].cards)) {
      throw new Error(`No card in deck with card id found: ${updatedCard.id}`);
    }

    this.decks[deckId].cards[updatedCard.id] = updatedCard;
  }

  public removeCard(deckId: string, cardId: string): void {
    if (!(deckId in this.decks)) {
      throw new Error(`No deck with id found: ${deckId}`);
    }

    if (!(cardId in this.decks[deckId].cards)) {
      throw new Error(`No card in deck with card id found: ${cardId}`);
    }

    delete this.decks[deckId].cards[cardId];
  }

  public async save(): Promise<void> {
    await this.jsonFileManager.writeJsonFile(
      DECKS_FILE,
      this.toJsonStructure(),
    );
  }

  public async delete(id: string): Promise<void> {
    if (!(id in this.decks)) {
      throw new Error(`Deck name does not exist: ${id}`);
    }

    delete this.decks[id];
    await this.save();
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
