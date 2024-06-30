import { ButtonComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { AnkiAlgorithm, PerformanceResponse } from 'src/spaced-repetition/anki';
import { RecallView } from '.';
import { RecallSubView } from './sub-view';
import { Deck } from 'src/data/deck';

export class ReviewView extends RecallSubView {
  private rootEl: HTMLElement;
  private contentEl: HTMLElement;

  private ankiAlgorithm: AnkiAlgorithm;
  private currentItem: SpacedRepetitionItem | null = null;
  private deck: Deck;

  constructor(
    protected readonly plugin: BetterRecallPlugin,
    protected readonly recallView: RecallView,
  ) {
    super(plugin, recallView);
    this.ankiAlgorithm = new AnkiAlgorithm();
  }

  public setDeck(deck: Deck): void {
    this.deck = deck;
    this.deck.items.forEach((item) => this.ankiAlgorithm.addItem(item));
  }

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv('better-recall-review-view');
    this.contentEl = this.rootEl.createDiv('review-content');

    const againButton = new ButtonComponent(this.rootEl);
    againButton.setButtonText('Again');
    againButton.onClick(() => this.handleResponse(PerformanceResponse.AGAIN));

    const easyButton = new ButtonComponent(this.rootEl);
    easyButton.setButtonText('Easy');
    easyButton.onClick(() => this.handleResponse(PerformanceResponse.EASY));

    const goodButton = new ButtonComponent(this.rootEl);
    goodButton.setButtonText('Good');
    goodButton.onClick(() => this.handleResponse(PerformanceResponse.GOOD));

    const hardButton = new ButtonComponent(this.rootEl);
    hardButton.setButtonText('Hard');
    hardButton.onClick(() => this.handleResponse(PerformanceResponse.HARD));

    this.ankiAlgorithm.startNewSession();
    this.showNextItem();
  }

  private showNextItem(): void {
    this.currentItem = this.ankiAlgorithm.getNextReviewItem();
    if (this.currentItem) {
      this.contentEl.setText(this.currentItem.content.front);
    } else {
      this.contentEl.setText('Review session complete!');
    }
  }

  private handleResponse(response: PerformanceResponse): void {
    if (this.currentItem) {
      this.ankiAlgorithm.updateItemAfterReview(this.currentItem, response);
      this.showNextItem();
    }
  }
}
