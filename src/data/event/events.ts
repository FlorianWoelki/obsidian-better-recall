import { Deck } from '../manager/decks-manager';
import { Event } from './';

export type EventType = 'addDeck';
export type EventMap = {
  addDeck: Event<{ deck: Deck }>;
};
