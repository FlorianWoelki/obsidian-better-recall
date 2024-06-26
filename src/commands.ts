import BetterRecallPlugin from './main';

export function registerCommands(plugin: BetterRecallPlugin): void {
  plugin.addCommand({
    id: 'better-recall-recall-view',
    name: 'Recall',
    callback: () => {
      plugin.openRecallView();
    },
  });
}
