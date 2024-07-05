import type { SpacedRepetitionItem } from '../../spaced-repetition';
import type { Deck } from '../deck';
import type { Event } from './';

export type EditItemEvent = Event<{
  deckId: string;
  newItem: SpacedRepetitionItem;
}>;

export type AddDeckEvent = Event<{ deck: Deck }>;

export type EditDeckEvent = Event<{ deck: Deck }>;

export type AddItemEvent = Event<{
  deckId: string;
  item: SpacedRepetitionItem;
}>;

export type DeleteItemEvent = Event<{
  deckId: string;
  deletedItem: SpacedRepetitionItem;
}>;

export type EventMap = {
  addDeck: AddDeckEvent;
  editDeck: EditDeckEvent;
  addItem: AddItemEvent;
  editItem: EditItemEvent;
  deleteItem: DeleteItemEvent;
};

export type EventType = keyof EventMap;
export type AnyEvent = EventMap[EventType];
