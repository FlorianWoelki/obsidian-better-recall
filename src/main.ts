import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { BetterRecallSettings, DEFAULT_SETTINGS } from './settings/data';
import { FILE_VIEW_TYPE, RecallView } from './ui/recall-view';
import { DecksManager } from './data/manager/decks-manager';

export default class BetterRecallPlugin extends Plugin {
  public readonly decksManager = new DecksManager(
    this.app.vault,
    'obsidian-better-recall',
  );

  private data: Record<string, BetterRecallSettings>;

  async onload() {
    console.log('loading better recall');

    await this.decksManager.load();

    await this.loadSettings();

    this.registerView(FILE_VIEW_TYPE, (leaf) => new RecallView(this, leaf));
    registerCommands(this);

    this.addRibbonIcon('wallet-cards', 'Open Decks', () => {
      this.openRecallView();
    });
  }

  onunload() {
    console.log('unloading better recall');
  }

  /**
   * Opens the recall view of the plugin which displays all possible decks.
   */
  public openRecallView(): void {
    const leaf = this.app.workspace.getLeaf(false);
    leaf.setViewState({
      type: FILE_VIEW_TYPE,
      state: {},
    });
    this.app.workspace.setActiveLeaf(leaf);
  }

  /**
   * Loads and initializes the settings for the plugin.
   * First, it loads the existing data from the plugin and then checks for any missing
   * settings and applies default values where necessary.
   * Finally, it populates the `data` property with this loaded data.
   * @returns Promise that resolves when the settings have been loaded and initialized.
   */
  private async loadSettings(): Promise<void> {
    const data = await this.loadData();
    if (data) {
      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        if (data.settings[key] === undefined) {
          data.settings[key] = value;
        }
      });
    }
    this.data = Object.assign({ settings: { ...DEFAULT_SETTINGS } }, {}, data);
  }

  public getSettings(): BetterRecallSettings {
    return this.data.settings;
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.data);
  }
}
