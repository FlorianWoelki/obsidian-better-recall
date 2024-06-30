import BetterRecallPlugin from 'src/main';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { AnkiAlgorithm, PerformanceResponse } from 'src/spaced-repetition/anki';
import { RecallView } from '.';
import { RecallSubView } from './sub-view';
import { Deck } from 'src/data/deck';
import { BUTTONS_BAR_CLASS, CENTERED_VIEW } from '../classes';
import { ButtonsBarComponent } from '../ButtonsBarComponent';
import { ButtonComponent } from 'obsidian';

export class ReviewView extends RecallSubView {
  private rootEl: HTMLElement;
  private contentEl: HTMLElement;

  private showAnswerButtonsBarComp: ButtonsBarComponent;
  private recallButtonsBarEl: HTMLElement;

  private cardFrontEl: HTMLElement;
  private dividerEl: HTMLElement;
  private cardBackEl: HTMLElement;

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
    this.rootEl = this.recallView.rootEl.createDiv(CENTERED_VIEW);
    this.contentEl = this.rootEl.createDiv(
      'better-recall-card better-recall-review-card',
    );

    this.cardFrontEl = this.contentEl.createEl('h3', {
      cls: 'better-recall-review-card__content',
    });
    this.dividerEl = this.contentEl.createEl('div', {
      cls: 'better-recall-review-card__divider',
    });
    this.cardBackEl = this.contentEl.createEl('h3', {
      cls: 'better-recall-review-card__content',
    });

    this.showAnswerButtonsBarComp = new ButtonsBarComponent(this.rootEl)
      .setCloseButtonText('Exit')
      .setSubmitText('Show answer')
      .setSubmitButtonDisabled(false)
      .onSubmit(() => {
        this.cardBackEl.removeClass('better-recall-review-card--hidden');
        this.dividerEl.removeClass('better-recall-review-card--hidden');
        this.showAnswerButtonsBarComp.buttonsBarEl.addClass(
          'better-recall--display-none',
        );
        this.renderRecallButtons();
      })
      .onClose(this.recallView.goToDecksView.bind(this));
    this.showAnswerButtonsBarComp.buttonsBarEl.addClass(
      'better-recall-review-card__answer-buttons-bar',
    );

    this.ankiAlgorithm.startNewSession();
    this.showNextItem();
  }

  private renderRecallButtons(): void {
    this.recallButtonsBarEl = this.rootEl.createDiv(BUTTONS_BAR_CLASS);

    const againButton = new ButtonComponent(this.recallButtonsBarEl);
    againButton.buttonEl.addClass('better-recall-review-card__recall-action');
    const againEmojiEl = againButton.buttonEl.createSpan();
    const againTextEl = againButton.buttonEl.createSpan();
    againEmojiEl.setText('❌');
    againTextEl.setText('Again');
    againButton.onClick(() => this.handleResponse(PerformanceResponse.AGAIN));

    const goodButton = new ButtonComponent(this.recallButtonsBarEl);
    goodButton.buttonEl.addClass('better-recall-review-card__recall-action');
    const goodEmojiEl = goodButton.buttonEl.createSpan();
    const goodTextEl = goodButton.buttonEl.createSpan();
    goodEmojiEl.setText('😬');
    goodTextEl.setText('Good');
    goodButton.onClick(() => this.handleResponse(PerformanceResponse.GOOD));

    const hardButton = new ButtonComponent(this.recallButtonsBarEl);
    hardButton.buttonEl.addClass('better-recall-review-card__recall-action');
    const hardEmojiEl = hardButton.buttonEl.createSpan();
    const hardTextEl = hardButton.buttonEl.createSpan();
    hardEmojiEl.setText('😰');
    hardTextEl.setText('Hard');
    hardButton.onClick(() => this.handleResponse(PerformanceResponse.HARD));

    const easyButton = new ButtonComponent(this.recallButtonsBarEl);
    easyButton.buttonEl.addClass('better-recall-review-card__recall-action');
    const easyEmojiEl = easyButton.buttonEl.createSpan();
    const easyTextEl = easyButton.buttonEl.createSpan();
    easyEmojiEl.setText('👑');
    easyTextEl.setText('Easy');
    easyButton.onClick(() => this.handleResponse(PerformanceResponse.EASY));
  }

  private showNextItem(): void {
    if (this.recallButtonsBarEl) {
      this.recallButtonsBarEl.remove();
    }

    this.showAnswerButtonsBarComp.buttonsBarEl.removeClass(
      'better-recall--display-none',
    );

    this.currentItem = this.ankiAlgorithm.getNextReviewItem();
    if (this.currentItem) {
      this.cardFrontEl.setText(this.currentItem.content.front);
      this.cardBackEl.setText(this.currentItem.content.back);
      this.dividerEl.addClass('better-recall-review-card--hidden');
      this.cardBackEl.addClass('better-recall-review-card--hidden');
    } else {
      this.cardFrontEl.setText('Review session complete!');
    }
  }

  private handleResponse(response: PerformanceResponse): void {
    if (this.currentItem) {
      this.ankiAlgorithm.updateItemAfterReview(this.currentItem, response);
      this.showNextItem();
    }
  }
}
