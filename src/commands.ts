import BetterRecallPlugin from './main';
import { FILE_VIEW_TYPE } from './ui/recall-view';

export function registerCommands(plugin: BetterRecallPlugin): void {
  plugin.addCommand({
    id: 'better-recall-recall-view',
    name: 'Recall',
    callback: () => {
      const leaf = this.app.workspace.getLeaf(false);
      leaf.setViewState({
        type: FILE_VIEW_TYPE,
        state: {},
      });
      this.app.workspace.setActiveLeaf(leaf);
    },
  });
}
