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
  settings: any;
  items: SpacedRepetitionItem[];
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
    jsonObject.settings,
    jsonObject.items,
  );
}

export class Deck {
  constructor(
    private readonly algorithm: SpacedRepetitionAlgorithm<unknown>,
    public readonly name: string,
    public readonly description: string,
    public readonly id: string = uuidv4(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly settings: any = {},
    public readonly items: SpacedRepetitionItem[] = [],
  ) {}

  public toJsonObject(): DeckJsonStructure {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      settings: this.settings,
      items: this.items,
    };
  }

  public get learnItems(): SpacedRepetitionItem[] {
    return this.items.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (
        curr.state === CardState.LEARNING ||
        curr.state === CardState.RELEARNING
      ) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public get dueItems(): SpacedRepetitionItem[] {
    return this.items.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (curr.state === CardState.REVIEW && this.algorithm.isDueToday(curr)) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public get newItems(): SpacedRepetitionItem[] {
    return this.items.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (curr.state === CardState.NEW) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }
}
