import { Deck, DeckJsonStructure, jsonObjectToDeck } from '../deck';
import {
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
  CardState,
} from '../../spaced-repetition';
import BetterRecallPlugin from 'src/main';

export class DecksManager {
  private decks: Record<string, Deck>;
  private algorithm: SpacedRepetitionAlgorithm<unknown>;

  constructor(
    private plugin: BetterRecallPlugin,
    algorithm: SpacedRepetitionAlgorithm<unknown>,
  ) {
    this.decks = {};
    this.algorithm = algorithm;
  }

  public async load(): Promise<void> {
    const decks = this.plugin.getData().decks;
    if (!decks) {
      return;
    }

    decks.forEach((deck) => {
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
      throw new Error(`Deck with id does not exist: ${id}`);
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

  public async resetCardsForAlgorithmSwitch(): Promise<void> {
    Object.values(this.decks).forEach((deck) => {
      Object.values(deck.cards).forEach((card) => {
        card.state = CardState.NEW;
        card.iteration = 0;
        card.lastReviewDate = undefined;
        card.nextReviewDate = undefined;
        card.metadata = {};

        const reinitializedCard = this.algorithm.createNewCard(
          card.id,
          card.content,
        );

        deck.cards[card.id] = reinitializedCard;
      });
    });

    await this.save();
  }

  public async save(): Promise<void> {
    this.plugin.getData().decks = this.toJsonStructure();
    await this.plugin.savePluginData();
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

  private toJsonStructure(): DeckJsonStructure[] {
    const decks = this.decksArray.map((deck) => deck.toJsonObject());
    return decks;
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
