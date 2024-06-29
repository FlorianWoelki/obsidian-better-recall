import type { Deck } from '../deck';
import type { Event } from './';

export type EventType = 'addDeck' | 'editDeck';

export type EventMap = {
  addDeck: Event<{ deck: Deck }>;
  editDeck: Event<{ deck: Deck }>;
};
