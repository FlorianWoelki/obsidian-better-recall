import { Plugin } from "obsidian";
import { BetterRecallSettings } from "./settings/data";

export default class BetterRecall extends Plugin {
  private data: Record<string, BetterRecallSettings>;

  onload() {
    console.log("loading better recall");
  }

  onunload() {
    console.log("unloading better recall");
  }

  public getSettings(): BetterRecallSettings {
    return this.data.settings;
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.data);
  }
}
