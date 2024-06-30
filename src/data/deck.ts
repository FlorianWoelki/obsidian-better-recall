import { v4 as uuidv4 } from 'uuid';
import {
  CardState,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '../spaced-repetition';

export interface DecksJsonStructure {
  decks: DeckJsonStructure[];
}

export interface DeckJsonStructure {
  name: string;
  description: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  cards: SpacedRepetitionItem[];
}

export function jsonObjectToDeck(
  algorithm: SpacedRepetitionAlgorithm<unknown>,
  jsonObject: DeckJsonStructure,
): Deck {
  return new Deck(
    algorithm,
    jsonObject.name,
    jsonObject.description,
    jsonObject.id,
    jsonObject.createdAt,
    jsonObject.updatedAt,
    jsonObject.cards,
  );
}

export class Deck {
  constructor(
    private readonly algorithm: SpacedRepetitionAlgorithm<unknown>,
    private name: string,
    private description: string,
    public readonly id: string = uuidv4(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly cards: SpacedRepetitionItem[] = [],
  ) {}

  public toJsonObject(): DeckJsonStructure {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      cards: this.cards,
    };
  }

  public get learnCards(): SpacedRepetitionItem[] {
    return this.cards.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (
        curr.state === CardState.LEARNING ||
        curr.state === CardState.RELEARNING
      ) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public get dueCards(): SpacedRepetitionItem[] {
    return this.cards.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (curr.state === CardState.REVIEW && this.algorithm.isDueToday(curr)) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public get newCards(): SpacedRepetitionItem[] {
    return this.cards.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (curr.state === CardState.NEW) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public setName(name: string): void {
    this.name = name;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }
}
