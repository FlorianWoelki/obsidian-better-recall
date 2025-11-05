import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
  AnkiParameters,
  BetterRecallData,
  BetterRecallSettings,
  DEFAULT_SETTINGS,
  SchedulingAlgorithm,
} from './settings/data';
import { FILE_VIEW_TYPE, RecallView } from './ui/views';
import { DecksManager } from './data/manager/decks-manager';
import { EventEmitter } from './data/event';
import { FSRSAlgorithm } from './spaced-repetition/fsrs';
import { AnkiAlgorithm } from './spaced-repetition/anki';
import { SettingsTab } from './ui/settings/SettingsTab';
import { SpacedRepetitionAlgorithm } from './spaced-repetition';

export default class BetterRecallPlugin extends Plugin {
  public algorithm: SpacedRepetitionAlgorithm<unknown>;
  public decksManager: DecksManager;

  private data: BetterRecallData;
  private eventEmitter: EventEmitter;

  async onload() {
    console.log('loading better recall');
    this.eventEmitter = new EventEmitter();

    await this.loadPluginData();
    this.algorithm = this.initAlgorithm();
    this.decksManager = new DecksManager(this, this.algorithm);
    await this.decksManager.load();

    this.registerView(FILE_VIEW_TYPE, (leaf) => new RecallView(this, leaf));
    registerCommands(this);

    this.addRibbonIcon('wallet-cards', 'Open decks', () => {
      this.openRecallView();
    });

    this.addSettingTab(new SettingsTab(this));
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
   * Loads and initializes the data including the settings for the plugin.
   * First, it loads the existing data from the plugin and then checks for any missing
   * settings and applies default values where necessary.
   * Finally, it populates the `data` property with this loaded data.
   * @returns Promise that resolves when the settings have been loaded and initialized.
   */
  private async loadPluginData(): Promise<void> {
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

  private initAlgorithm(): SpacedRepetitionAlgorithm<unknown> {
    const settings = this.getSettings();

    if (settings.schedulingAlgorithm === SchedulingAlgorithm.Anki) {
      const algorithm = new AnkiAlgorithm();
      algorithm.setParameters(settings.ankiParameters);
      return algorithm;
    }

    const algorithm = new FSRSAlgorithm();
    algorithm.setParameters(settings.fsrsParameters);
    return algorithm;
  }

  public getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  public getSettings(): BetterRecallSettings {
    return this.data.settings;
  }

  public setAnkiParameter(
    key: keyof AnkiParameters,
    value: number | number[],
  ): void {
    if (key === 'learningSteps' || key === 'relearningSteps') {
      if (!Array.isArray(value)) {
        return;
      }

      this.getSettings().ankiParameters[key] = value;
      return;
    }

    if (typeof value === 'number') {
      this.getSettings().ankiParameters[key] = value;
    }
  }

  public async setSchedulingAlgorithm(
    algorithm: SchedulingAlgorithm,
  ): Promise<void> {
    this.getSettings().schedulingAlgorithm = algorithm;
    this.algorithm = this.initAlgorithm();
    this.decksManager = new DecksManager(this, this.algorithm);
    await this.decksManager.load();
  }

  public getData(): BetterRecallData {
    return this.data;
  }

  public async savePluginData(): Promise<void> {
    await this.saveData(this.data);
  }
}
