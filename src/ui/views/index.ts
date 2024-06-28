import { FileView, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { EmptyView } from './empty-view';
import { ReviewView } from './review-view';
import { DecksView } from './decks-view';
import { RecallSubView } from './sub-view';

export const FILE_VIEW_TYPE = 'recall-view';

enum ViewMode {
  Empty,
  Decks,
  Review,
}

export class RecallView extends FileView {
  public readonly rootEl: HTMLElement;

  private currentView?: RecallSubView;
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

    const viewContent = this.containerEl.querySelector('.view-content');
    if (!viewContent) {
      return;
    }

    this.rootEl = viewContent.createDiv('better-recall-recall-view');
    this.reviewView = new ReviewView(plugin, this);
    this.emptyView = new EmptyView(plugin, this);
    this.decksView = new DecksView(plugin, this);

    this.setViewMode(
      plugin.decksManager.decksArray.length === 0
        ? ViewMode.Empty
        : ViewMode.Decks,
    );
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
    this.currentView?.onClose();
    this.viewMode = viewMode;
    switch (this.viewMode) {
      case ViewMode.Empty:
        this.currentView = this.emptyView;
        break;
      case ViewMode.Decks:
        this.currentView = this.decksView;
        break;
      case ViewMode.Review:
        this.currentView = this.reviewView;
        break;
    }
  }

  private renderView(): void {
    this.rootEl.empty();
    this.currentView?.render();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
  }

  protected async onClose(): Promise<void> {
    this.currentView?.onClose();
    await super.onClose();
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
