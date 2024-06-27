import { ButtonComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { CardState, SpacedRepetitionItem } from 'src/spaced-repetition';
import { AnkiAlgorithm, PerformanceResponse } from 'src/spaced-repetition/anki';
import { RecallView } from '.';
import { RecallSubView } from './sub-view';

export class ReviewView extends RecallSubView {
  private rootEl: HTMLElement;
  private contentEl: HTMLElement;

  private ankiAlgorithm: AnkiAlgorithm;
  private currentItem: SpacedRepetitionItem | null = null;
  private items: SpacedRepetitionItem[] = [];

  constructor(
    protected readonly plugin: BetterRecallPlugin,
    protected readonly recallView: RecallView,
  ) {
    super(plugin, recallView);
    this.ankiAlgorithm = new AnkiAlgorithm();

    this.items = [
      {
        id: '1',
        content: 'Hello World',
        easeFactor: 2.5,
        interval: 0,
        iteration: 0,
        stepIndex: 0,
        state: CardState.NEW,
      },
      {
        id: '2',
        content: 'Small Test',
        easeFactor: 2.5,
        interval: 0,
        iteration: 0,
        stepIndex: 0,
        state: CardState.NEW,
      },
      {
        id: '3',
        content: 'Hello World 2.0',
        easeFactor: 2.5,
        interval: 0,
        iteration: 0,
        stepIndex: 0,
        state: CardState.NEW,
      },
    ];
    this.items.forEach((item) => this.ankiAlgorithm.addItem(item));
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
      this.contentEl.setText(this.currentItem.content);
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
