import { FileView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import BetterRecallPlugin from "../../main";
import { EmptyView } from "./empty-view";

export const FILE_VIEW_TYPE = "recall-view";

export class RecallView extends FileView {
  public readonly rootEl: HTMLElement;

  private emptyView: EmptyView;

  constructor(
    private plugin: BetterRecallPlugin,
    leaf: WorkspaceLeaf,
  ) {
    super(leaf);
    this.allowNoFile = true;

    const viewContent = this.containerEl.querySelector(".view-content");
    if (!viewContent) {
      return;
    }

    this.rootEl = viewContent.createDiv("better-recall-recall-view");
    this.emptyView = new EmptyView(this);
  }

  protected async onOpen(): Promise<void> {
    this.rootEl.empty();
    this.emptyView.render();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
  }

  getState() {
    const state = super.getState();
    return state;
  }

  getDisplayText(): string {
    return "Recall";
  }

  getViewType(): string {
    return FILE_VIEW_TYPE;
  }
}
