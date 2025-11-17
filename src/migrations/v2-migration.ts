import { BetterRecallData } from 'src/settings/data';
import {
  BasicSpacedRepetitionItem,
  ISpacedRepetitionItem,
} from 'src/spaced-repetition';

interface OldAnkiItem {
  type: number;
  content: {
    front: string;
    back: string;
  };
  state: number;
  easeFactor: number;
  interval: number;
  iteration: number;
  stepIndex: number;
  lastReviewDate?: string;
  nextReviewDate?: string;
}

const isOldAnkiItem = (obj: any): obj is OldAnkiItem => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const hasOldScheduling =
    typeof obj.easeFactor === 'number' &&
    typeof obj.interval === 'number' &&
    typeof obj.stepIndex === 'number';

  return typeof obj.type === 'number' && hasOldScheduling;
};

const migrateOldItem = (
  id: string,
  oldItem: OldAnkiItem,
): Omit<BasicSpacedRepetitionItem, 'id'> => {
  return {
    content: oldItem.content,
    type: oldItem.type,
    state: oldItem.state,
    iteration: oldItem.iteration ?? 0,
    lastReviewDate: oldItem.lastReviewDate
      ? new Date(oldItem.lastReviewDate)
      : undefined,
    nextReviewDate: oldItem.nextReviewDate
      ? new Date(oldItem.nextReviewDate)
      : undefined,
    metadata: {
      easeFactor: oldItem.easeFactor,
      interval: oldItem.interval,
      stepIndex: oldItem.stepIndex,
    },
  };
};

/**
 * This migration converts the old data in the old anki cards to the
 * new schema layout where the metadata is in the metadata object.
 * This migration was needed because the plugin now supports multiple
 * scheduling algorithms.
 * @param data BetterRecallData from the plugin.
 */
export const migrateToV2 = (data: BetterRecallData): void => {
  for (const deck of data.decks ?? []) {
    const items = deck.cards as Record<string, any> | undefined;
    if (!items) {
      continue;
    }

    const newItems: Record<string, Omit<ISpacedRepetitionItem, 'id'>> = {};

    for (const [id, rawItem] of Object.entries(items)) {
      if (isOldAnkiItem(rawItem)) {
        newItems[id] = migrateOldItem(id, rawItem);
      } else {
        newItems[id] = rawItem as ISpacedRepetitionItem;
      }
    }

    (deck as any).cards = newItems;
  }
};
