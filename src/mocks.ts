import { Deck } from './data/deck';
import { AnkiAlgorithm } from './spaced-repetition/anki';

export const MOCK_DECK: Deck = new Deck(
  new AnkiAlgorithm(),
  'Mock deck',
  'Mock deck description',
);
