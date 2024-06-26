import { Plugin } from "obsidian";

export default class BetterRecall extends Plugin {
  onload() {
    console.log("loading better recall");
  }

  onunload() {
    console.log("unloading better recall");
  }
}
