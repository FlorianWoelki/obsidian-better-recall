import { DeckJsonStructure } from 'src/data/deck';

export interface BetterRecallData {
  settings: BetterRecallSettings;
  decks: DeckJsonStructure[];
}

export interface BetterRecallSettings {}

export const DEFAULT_SETTINGS: BetterRecallSettings = {};
