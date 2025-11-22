import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
  BetterRecallData,
  BetterRecallSettings,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  ParameterMap,
  SchedulingAlgorithm,
} from './settings/data';
import { FILE_VIEW_TYPE, RecallView } from './ui/views';
import { DecksManager } from './data/manager/decks-manager';
import { EventEmitter } from './data/event';
import { FSRSAlgorithm } from './spaced-repetition/fsrs';
import { AnkiAlgorithm } from './spaced-repetition/anki';
import { SettingsTab } from './ui/settings/SettingsTab';
import { SpacedRepetitionAlgorithm } from './spaced-repetition';
import { runMigrations } from './migrations';

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
   * It also runs the migrations, if the schema version is outdated.
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

      this.data = Object.assign(
        { settings: { ...DEFAULT_SETTINGS } },
        {},
        data,
      );

      const migrated = runMigrations(this.data);
      if (migrated) {
        await this.savePluginData();
      }
    } else {
      // Fresh install, no need for migrations or something else.
      this.data = Object.assign(
        {
          settings: { ...DEFAULT_SETTINGS },
          decks: [],
          schemaVersion: CURRENT_SCHEMA_VERSION,
        },
        {},
        data,
      );
    }
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

  public setParameter<
    T extends SchedulingAlgorithm,
    K extends keyof ParameterMap[T],
  >(paramsType: T, key: K, value: ParameterMap[T][K]): void {
    const params = this.getSettings()[
      `${paramsType}Parameters`
    ] as ParameterMap[T];
    params[key] = value;
    this.algorithm?.setParameters(params);
  }

  public async updateSchedulingAlgorithm(
    algorithm: SchedulingAlgorithm,
  ): Promise<void> {
    this.getSettings().schedulingAlgorithm = algorithm;
    this.algorithm = this.initAlgorithm();
    this.decksManager = new DecksManager(this, this.algorithm);
    await this.decksManager.load();
    await this.decksManager.resetCardsForAlgorithmSwitch();

    // Emit an event that will reflect the changes in the decks view.
    for (const deck of Object.values(this.decksManager.getDecks())) {
      this.eventEmitter.emit('editDeck', { deck });
    }
  }

  public getData(): BetterRecallData {
    return this.data;
  }

  public async savePluginData(): Promise<void> {
    await this.saveData(this.data);
  }
}
