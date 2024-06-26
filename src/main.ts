import { Plugin } from "obsidian";
import { BetterRecallSettings, DEFAULT_SETTINGS } from "./settings/data";
import { FILE_VIEW_TYPE, RecallView } from "./ui/recall-view";

export default class BetterRecallPlugin extends Plugin {
  private data: Record<string, BetterRecallSettings>;

  async onload() {
    console.log("loading better recall");

    await this.loadSettings();

    this.registerView(FILE_VIEW_TYPE, (leaf) => new RecallView(this, leaf));
    this.addCommand({
      id: "better-recall-recall-view",
      name: "Recall",
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

  onunload() {
    console.log("unloading better recall");
  }

  /**
   * Loads and initializes settings for the plugin.
   * First, it loads the existing data from the plugin and then checks for any missing
   * settings and applies default values where necessary.
   * Finally, it populates the `data` property with this loaded data.
   * @returns Promise that resolves when the settings have been loaded and initialized.
   */
  public async loadSettings(): Promise<void> {
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
