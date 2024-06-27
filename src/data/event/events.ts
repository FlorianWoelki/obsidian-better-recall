import { Deck } from '../manager/decks-manager';
import { Event } from './';

export interface AddDeckEvent extends Event {
  type: 'addDeck';
  payload: { deck: Deck };
}
