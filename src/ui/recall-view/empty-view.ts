import { RecallView } from '.';
import { RecallSubView } from './sub-view';

export class EmptyView extends RecallSubView {
  private rootEl: HTMLElement;

  constructor(public readonly recallView: RecallView) {
    super(recallView);
  }

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv('better-recall-empty-view');
    // Adds the `empty-state` class from Obsidian.
    this.rootEl.addClass('empty-state');

    // Uses the `empty-state-container` class from Obsidian.
    const containerEl = this.rootEl.createDiv('empty-state-container');
    // Uses the `empty-state-title` class from Obsidian.
    const titleContainerEl = containerEl.createDiv('empty-state-title');
    titleContainerEl.style.marginBottom = '10px';
    titleContainerEl.setText('No available decks');

    // Uses the `empty-state-action-list` class from Obsidian.
    const actionListContainerEl = containerEl.createDiv(
      'empty-state-action-list',
    );
    // Uses the `empty-state-action` class from Obsidian.
    const createNewDeckActionEl =
      actionListContainerEl.createDiv('empty-state-action');
    createNewDeckActionEl.setText('Create new Deck');
    createNewDeckActionEl.onClickEvent(() => {
      // TODO: Add functionality.
    });
  }
}
