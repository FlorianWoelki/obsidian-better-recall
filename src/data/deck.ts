import { v4 as uuidv4 } from 'uuid';
import {
  CardState,
  SpacedRepetitionAlgorithm,
  SpacedRepetitionItem,
} from '../spaced-repetition';

// We do not need the id because it's already in the key of the object.
export type CardJsonStructure = Omit<SpacedRepetitionItem, 'id'>;

export interface DeckJsonStructure {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  // Using object instead of array for performance gains.
  cards: Record<string, CardJsonStructure>;
}

export function getDefaultDeck(): DeckJsonStructure {
  return {
    id: uuidv4(),
    name: 'Default Deck',
    description: 'The default deck',
    createdAt: new Date().toDateString(),
    updatedAt: new Date().toDateString(),
    cards: {},
  };
}

export function jsonObjectToDeck(
  algorithm: SpacedRepetitionAlgorithm<unknown>,
  jsonObject: DeckJsonStructure,
): Deck {
  const cards = Object.entries(jsonObject.cards).reduce(
    (acc, [id, card]) => {
      acc[id] = {
        ...card,
        id,
        lastReviewDate: convertStringToDate(
          card.lastReviewDate as unknown as string,
        ),
        nextReviewDate: convertStringToDate(
          card.nextReviewDate as unknown as string,
        ),
      };
      return acc;
    },
    {} as Record<string, SpacedRepetitionItem>,
  );

  return new Deck(
    algorithm,
    jsonObject.name,
    jsonObject.description,
    jsonObject.id,
    convertStringToDate(jsonObject.createdAt),
    convertStringToDate(jsonObject.updatedAt),
    cards,
  );
}

function convertStringToDate(dateStr?: string): Date | undefined {
  return dateStr ? new Date(dateStr) : undefined;
}

export class Deck {
  constructor(
    private readonly algorithm: SpacedRepetitionAlgorithm<unknown>,
    private name: string,
    private description: string,
    public readonly id: string = uuidv4(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly cards: Record<string, SpacedRepetitionItem> = {},
  ) {}

  public toJsonObject(): DeckJsonStructure {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt.toDateString(),
      updatedAt: this.updatedAt.toDateString(),
      // Cards which does not have the `id` in its value.
      cards: Object.entries(this.cards).reduce<
        Record<string, CardJsonStructure>
      >((acc, [id, card]) => {
        const newCard: CardJsonStructure & { id?: string } = { ...card };
        delete newCard.id;
        acc[id] = newCard;
        return acc;
      }, {}),
    };
  }

  public get cardsArray(): SpacedRepetitionItem[] {
    return Object.values(this.cards);
  }

  public get learnCards(): SpacedRepetitionItem[] {
    return this.cardsArray.reduce<SpacedRepetitionItem[]>((acc, curr) => {
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
    return this.cardsArray.reduce<SpacedRepetitionItem[]>((acc, curr) => {
      if (curr.state === CardState.REVIEW && this.algorithm.isDueToday(curr)) {
        acc.push(curr);
      }

      return acc;
    }, []);
  }

  public get newCards(): SpacedRepetitionItem[] {
    return this.cardsArray.reduce<SpacedRepetitionItem[]>((acc, curr) => {
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
