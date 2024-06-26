import { Plugin } from "obsidian";
import { BetterRecallSettings } from "./settings/data";
import { FILE_VIEW_TYPE, RecallView } from "./ui/recall-view";

export default class BetterRecallPlugin extends Plugin {
  private data: Record<string, BetterRecallSettings>;

  onload() {
    console.log("loading better recall");

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

  public getSettings(): BetterRecallSettings {
    return this.data.settings;
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.data);
  }
}
