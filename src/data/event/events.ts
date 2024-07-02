import type { SpacedRepetitionItem } from '../../spaced-repetition';
import type { Deck } from '../deck';
import type { Event } from './';

export type EventMap = {
  addDeck: Event<{ deck: Deck }>;
  editDeck: Event<{ deck: Deck }>;
  addItem: Event<{ deckId: string; item: SpacedRepetitionItem }>;
  editItem: Event<{ deckId: string; newItem: SpacedRepetitionItem }>;
};

export type EventType = keyof EventMap;
export type AnyEvent = EventMap[EventType];
