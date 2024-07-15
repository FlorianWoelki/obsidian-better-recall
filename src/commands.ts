import BetterRecallPlugin from './main';
import { AddCardModal } from './ui/modals/card-modal/AddCardModal';

export function registerCommands(plugin: BetterRecallPlugin): void {
  plugin.addCommand({
    id: 'better-recall-recall-view',
    name: 'Recall',
    callback: () => {
      plugin.openRecallView();
    },
  });
  plugin.addCommand({
    id: 'better-recall-add-card',
    name: 'Add Card',
    callback: () => {
      new AddCardModal(plugin).open();
    },
  });
}
