import { FileView, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { EmptyView } from './empty-view';
import { ReviewView } from './review-view';
import { DecksView } from './decks-view';

export const FILE_VIEW_TYPE = 'recall-view';

enum ViewMode {
  Empty,
  Decks,
  Review,
}

export class RecallView extends FileView {
  public readonly rootEl: HTMLElement;

  private emptyView: EmptyView;
  private reviewView: ReviewView;
  private decksView: DecksView;

  private viewMode: ViewMode;

  constructor(
    private plugin: BetterRecallPlugin,
    leaf: WorkspaceLeaf,
  ) {
    super(leaf);
    this.allowNoFile = true;
    this.setViewMode(
      plugin.decksManager.decksArray.length === 0
        ? ViewMode.Empty
        : ViewMode.Decks,
    );

    const viewContent = this.containerEl.querySelector('.view-content');
    if (!viewContent) {
      return;
    }

    this.rootEl = viewContent.createDiv('better-recall-recall-view');
    this.reviewView = new ReviewView(plugin, this);
    this.emptyView = new EmptyView(plugin, this);
    this.decksView = new DecksView(plugin, this);
  }

  protected async onOpen(): Promise<void> {
    this.renderView();

    this.plugin.getEventEmitter().on('addDeck', (payload) => {
      if (this.viewMode === ViewMode.Empty) {
        this.setViewMode(ViewMode.Decks);
        this.renderView();
      }
    });
  }

  private setViewMode(viewMode: ViewMode): void {
    this.viewMode = viewMode;
  }

  private renderView(): void {
    this.rootEl.empty();
    switch (this.viewMode) {
      case ViewMode.Empty:
        this.emptyView.render();
        break;
      case ViewMode.Decks:
        this.decksView.render();
        break;
      case ViewMode.Review:
        this.reviewView.render();
        break;
    }
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
  }

  getState() {
    const state = super.getState();
    return state;
  }

  getDisplayText(): string {
    return 'Recall';
  }

  getViewType(): string {
    return FILE_VIEW_TYPE;
  }
}
