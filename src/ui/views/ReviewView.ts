import BetterRecallPlugin from 'src/main';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { PerformanceResponse } from 'src/spaced-repetition/anki';
import { RecallView } from '.';
import { RecallSubView } from './SubView';
import { Deck } from 'src/data/deck';
import { BUTTONS_BAR_CLASS, CENTERED_VIEW } from '../classes';
import { ButtonComponent, MarkdownRenderer } from 'obsidian';
import { formatTimeDifference } from 'src/util';

enum ReviewState {
  ONGOING,
  FINISHED,
}

export class ReviewView extends RecallSubView {
  private rootEl: HTMLElement;
  private contentEl: HTMLElement;
  private vaultRootPath: string;

  private answerButtonsBarEl: HTMLElement;
  private recallButtonsBarEl: HTMLElement;

  private cardFrontEl: HTMLElement;
  private dividerEl: HTMLElement;
  private cardBackEl: HTMLElement;
  private showAnswerButton: ButtonComponent;

  private currentItem: SpacedRepetitionItem | null = null;
  private deck: Deck;
  private state: ReviewState;

  constructor(
    protected readonly plugin: BetterRecallPlugin,
    protected readonly recallView: RecallView,
  ) {
    super(plugin, recallView);
    this.vaultRootPath = plugin.app.vault.getRoot().path;
  }

  public setDeck(deck: Deck): void {
    this.deck = deck;
    // Resets all the items for the algorithm to not have duplicated entries
    // when restarting the recall view.
    this.plugin.algorithm.resetItems();
    this.deck.cardsArray.forEach((card) => this.plugin.algorithm.addItem(card));
    // Starts new session with the items added before.
    this.plugin.algorithm.startNewSession();
    this.state = ReviewState.ONGOING;
  }

  private handleKeyInput(event: KeyboardEvent): void {
    if (this.state === ReviewState.FINISHED) {
      return;
    }

    const isAnswerButtonsBarVisible = !this.answerButtonsBarEl.hasClass(
      'better-recall--display-none',
    );
    if (isAnswerButtonsBarVisible) {
      // Key `Space` pressed.
      if (event.key === ' ') {
        this.showRecallButtons();
      }
    } else {
      if (event.key === '1') {
        // Handle again press.
        this.handleResponse(PerformanceResponse.AGAIN);
      } else if (event.key === '2') {
        // Handle good press.
        this.handleResponse(PerformanceResponse.GOOD);
      } else if (event.key === '3') {
        // Handle hard press.
        this.handleResponse(PerformanceResponse.HARD);
      } else if (event.key === '4') {
        // Handle easy press.
        this.handleResponse(PerformanceResponse.EASY);
      }
    }
  }

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv(CENTERED_VIEW);
    document.addEventListener('keypress', this.handleKeyInput.bind(this));

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

    this.renderAnswerButtons();
    this.showNextItem();
  }

  private renderAnswerButtons(): void {
    this.answerButtonsBarEl = this.rootEl.createDiv(
      `${BUTTONS_BAR_CLASS} better-recall-review-card__answer-buttons-bar`,
    );

    const exitButton = new ButtonComponent(this.answerButtonsBarEl);
    const exitEmojiEl = exitButton.buttonEl.createSpan();
    const exitTextEl = exitButton.buttonEl.createSpan();
    exitEmojiEl.setText('🚪');
    exitTextEl.setText('Exit');
    exitButton.onClick(() => this.recallView.openDecksView());

    this.showAnswerButton = new ButtonComponent(
      this.answerButtonsBarEl,
    ).setCta();
    const showAnswerEmojiEl = this.showAnswerButton.buttonEl.createSpan();
    const showAnswerTextEl = this.showAnswerButton.buttonEl.createSpan();
    showAnswerEmojiEl.setText('👀');
    showAnswerTextEl.setText('Show answer');
    this.showAnswerButton.onClick(this.showRecallButtons.bind(this));
  }

  private renderRecallButtons(): void {
    this.recallButtonsBarEl = this.rootEl.createDiv(
      `${BUTTONS_BAR_CLASS} better-recall-review-card__answer-buttons-bar`,
    );

    this.renderButton(PerformanceResponse.AGAIN, '❌', 'Again');

    this.renderButton(PerformanceResponse.GOOD, '😬', 'Good');

    this.renderButton(PerformanceResponse.HARD, '😰', 'Hard');

    this.renderButton(PerformanceResponse.EASY, '👑', 'Easy');
  }

  private renderButton(
    performanceResponse: PerformanceResponse,
    emoji: string,
    text: string,
  ): void {
    if (!this.currentItem) {
      return;
    }

    const button = new ButtonComponent(this.recallButtonsBarEl);
    const emojiEl = button.buttonEl.createSpan();
    const textEl = button.buttonEl.createSpan();
    const timeEl = button.buttonEl.createSpan(
      'better-recall-review-card__time',
    );
    emojiEl.setText(emoji);
    textEl.setText(text);

    const nextReviewDate =
      this.plugin.algorithm.calculatePotentialNextReviewDate(
        this.currentItem,
        performanceResponse,
      );
    timeEl.setText(formatTimeDifference(nextReviewDate));
    button.onClick(() => this.handleResponse(performanceResponse));
  }

  private showRecallButtons(): void {
    this.cardBackEl.removeClass('better-recall--display-none');
    this.dividerEl.removeClass('better-recall--display-none');
    this.answerButtonsBarEl.addClass('better-recall--display-none');
    this.renderRecallButtons();
  }

  private showNextItem(): void {
    if (this.recallButtonsBarEl) {
      this.recallButtonsBarEl.remove();
    }

    this.answerButtonsBarEl.removeClass('better-recall--display-none');

    this.currentItem = this.plugin.algorithm.getNextReviewItem();

    this.dividerEl.addClass('better-recall--display-none');
    this.cardBackEl.addClass('better-recall--display-none');
    if (this.currentItem) {
      // Need to empty the elements because `MarkdownRenderer` will always append
      // the markdown to the elements.
      this.cardFrontEl.empty();
      this.cardBackEl.empty();

      MarkdownRenderer.render(
        this.plugin.app,
        this.currentItem.content.front,
        this.cardFrontEl,
        this.vaultRootPath,
        this.plugin,
      );
      MarkdownRenderer.render(
        this.plugin.app,
        this.currentItem.content.back,
        this.cardBackEl,
        this.vaultRootPath,
        this.plugin,
      );

      // TODO: Check why event listeners are deactivated for internal links.
      this.cardFrontEl.querySelectorAll('a.internal-link').forEach((link) => {
        link.addEventListener('click', this.handleInternalLinkClick.bind(this));
      });
      this.cardBackEl.querySelectorAll('a.internal-link').forEach((link) => {
        link.addEventListener('click', this.handleInternalLinkClick.bind(this));
      });
    } else {
      this.cardFrontEl.setText('Review session complete 🚀!');
      this.showAnswerButton.buttonEl.hide();
      this.state = ReviewState.FINISHED;
    }
  }

  private handleInternalLinkClick(event: MouseEvent): void {
    event.preventDefault();
    const href = (event.target as HTMLAnchorElement).getAttribute('data-href');
    if (href) {
      this.plugin.app.workspace.openLinkText(href, this.vaultRootPath, true);
    }
  }

  private handleResponse(response: PerformanceResponse): void {
    if (this.currentItem) {
      this.plugin.algorithm.updateItemAfterReview(this.currentItem, response);
      this.showNextItem();
    }
  }

  public onClose(): void {
    super.onClose();
    document.removeEventListener('keypress', this.handleKeyInput.bind(this));
    this.cardFrontEl.querySelectorAll('a.internal-link').forEach((link) => {
      link.removeEventListener(
        'click',
        this.handleInternalLinkClick.bind(this),
      );
    });
    this.cardBackEl.querySelectorAll('a.internal-link').forEach((link) => {
      link.removeEventListener(
        'click',
        this.handleInternalLinkClick.bind(this),
      );
    });
    this.plugin.decksManager.save();
  }
}
