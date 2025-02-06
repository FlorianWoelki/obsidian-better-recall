import { FileView, ViewStateResult, WorkspaceLeaf } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { EmptyView } from './EmptyView';
import { ReviewView } from './ReviewView';
import { DecksView } from './DecksView';
import { RecallSubView } from './SubView';
import { Deck } from 'src/data/deck';

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
    this.icon = 'blocks';

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

    this.plugin.getEventEmitter().on('addDeck', this.handleAddDeck.bind(this));
  }

  private handleAddDeck(): void {
    if (this.viewMode === ViewMode.Empty) {
      this.setViewMode(ViewMode.Decks);
      this.renderView();
    }
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

  /**
   * Starts reviewing a specific deck.
   * This function updates the deck for the `review-view`, sets the
   * view mode and rerenders the current view.
   * @param deck The deck which will be reviewed.
   */
  public startReviewingDeck(deck: Deck): void {
    this.reviewView.setDeck(deck);
    this.setViewMode(ViewMode.Review);
    this.renderView();
  }

  public openDecksView(): void {
    this.setViewMode(ViewMode.Decks);
    this.renderView();
  }

  public openEmptyView(): void {
    this.setViewMode(ViewMode.Empty);
    this.renderView();
  }

  private renderView(): void {
    this.rootEl.empty();
    this.currentView?.render();
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
  }

  protected async onClose(): Promise<void> {
    this.currentView?.onClose();
    this.plugin.getEventEmitter().off('addDeck', this.handleAddDeck.bind(this));
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
