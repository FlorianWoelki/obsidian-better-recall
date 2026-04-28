import { ButtonComponent, getIcon } from 'obsidian';
import { RecallSubView } from './SubView';
import BetterRecallPlugin from 'src/main';
import { RecallView } from '.';
import { EditDeckModal } from '../modals/EditDeckModal';
import { Deck } from 'src/data/deck';
import { AddCardModal } from '../modals/card-modal/AddCardModal';
import {
  DECK_BUTTON,
  DECK_MAIN,
  DECK_NAME,
  DECK_TABLE,
  DUE_CARDS_COLOR,
  LEARN_CARDS_COLOR,
  NEW_CARDS_COLOR,
} from '../classes';
import { EditCardsModal } from '../modals/EditCardsModal';
import {
  AddItemEvent,
  DeleteItemEvent,
  EditDeckEvent,
} from 'src/data/event/events';
import { SpacedRepetitionItem } from 'src/spaced-repetition';

const visibleClass = 'better-recall-deck-action--visible';
const rowAttributes = {
  newCardsCount: {
    plain: 'data-new-cards-count',
    attr: '[data-new-cards-count]',
  },
  learnCardsCount: {
    plain: 'data-learn-cards-count',
    attr: '[data-learn-cards-count]',
  },
  dueCardsCount: {
    plain: 'data-due-cards-count',
    attr: '[data-due-cards-count]',
  },
};

export class DecksView extends RecallSubView {
  declare private rootEl: HTMLElement;

  private boundAddDeck = this.handleAddDeck.bind(this);
  private boundAddItem = this.handleAddItem.bind(this);
  private boundDeleteItem = this.handleDeleteItem.bind(this);
  private boundDeleteDeck = this.handleDeleteDeck.bind(this);
  private boundEditDeck = this.handleEditDeck.bind(this);

  constructor(plugin: BetterRecallPlugin, recallView: RecallView) {
    super(plugin, recallView);

    this.plugin.getEventEmitter().on('addDeck', this.boundAddDeck);
    this.plugin.getEventEmitter().on('editDeck', this.boundEditDeck);
    this.plugin.getEventEmitter().on('addItem', this.boundAddItem);
    this.plugin.getEventEmitter().on('deleteItem', this.boundDeleteItem);
    this.plugin.getEventEmitter().on('deleteDeck', this.boundDeleteDeck);
  }

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv('better-recall-decks-view');

    this.renderDecks();
    this.renderButtons();
    this.renderActivityGraphs();
  }

  private handleDeleteDeck(): void {
    this.recallView.rootEl.empty();
    this.render();
  }

  private handleAddDeck(): void {
    this.recallView.rootEl.empty();
    this.render();
  }

  private handleEditDeck({ payload }: EditDeckEvent): void {
    if (!payload) {
      return;
    }

    const { deck } = payload;

    // Updates the information based in the first column of the table.
    const deckNameEl = this.getDeckRowEl(deck.id)?.querySelector(
      'a',
    ) as HTMLElement | null;
    if (!deckNameEl) {
      return;
    }

    deckNameEl.setText(deck.getName());
    deckNameEl.title = deck.getDescription();

    // Updates the cards if the cards data have been updated.
    const deckRowEl = this.getDeckRowEl(deck.id);
    if (!deckRowEl) {
      return;
    }

    this.refreshNewCardsCount(deck.id, deckRowEl);
    this.refreshLearnCardsCount(deck.id, deckRowEl);
    this.refreshDueCardsCount(deck.id, deckRowEl);
  }

  private handleDeleteItem({ payload }: DeleteItemEvent): void {
    if (!payload) {
      return;
    }

    const { deckId } = payload;

    const deckRowEl = this.getDeckRowEl(deckId);
    if (!deckRowEl) {
      return;
    }

    this.refreshNewCardsCount(deckId, deckRowEl);
    this.refreshLearnCardsCount(deckId, deckRowEl);
    this.refreshDueCardsCount(deckId, deckRowEl);
  }

  private handleAddItem({ payload }: AddItemEvent): void {
    if (!payload) {
      return;
    }

    const { deckId } = payload;

    const deckRowEl = this.getDeckRowEl(deckId);
    if (!deckRowEl) {
      return;
    }

    this.refreshNewCardsCount(deckId, deckRowEl);
    this.refreshLearnCardsCount(deckId, deckRowEl);
    this.refreshDueCardsCount(deckId, deckRowEl);
  }

  private refreshDueCardsCount(deckId: string, deckRowEl: HTMLElement): void {
    const cardsCountEl = this.getDueCardsCountEl(deckRowEl);
    if (!cardsCountEl) {
      return;
    }

    const cardsCount =
      this.plugin.decksManager.getDecks()[deckId].dueCards.length;
    this.updateCount(cardsCountEl, cardsCount, DUE_CARDS_COLOR);
  }

  private refreshLearnCardsCount(deckId: string, deckRowEl: HTMLElement): void {
    const cardsCountEl = this.getLearnCardsCountEl(deckRowEl);
    if (!cardsCountEl) {
      return;
    }

    const cardsCount =
      this.plugin.decksManager.getDecks()[deckId].learnCards.length;
    this.updateCount(cardsCountEl, cardsCount, LEARN_CARDS_COLOR);
  }

  private refreshNewCardsCount(deckId: string, deckRowEl: HTMLElement): void {
    const cardsCountEl = this.getNewCardsCountEl(deckRowEl);
    if (!cardsCountEl) {
      return;
    }

    const cardsCount =
      this.plugin.decksManager.getDecks()[deckId].newCards.length;
    this.updateCount(cardsCountEl, cardsCount, NEW_CARDS_COLOR);
  }

  private updateCount(
    el: HTMLElement,
    cardsCount: number,
    className: string,
  ): void {
    if (cardsCount > 0) {
      if (!el.hasClass(className)) {
        el.addClass(className);
      }
    } else {
      el.removeClass(className);
    }
    el.setText(String(cardsCount));
  }

  private getDeckRowEl(deckId: string): HTMLElement | null {
    return this.recallView.rootEl.querySelector(`[data-deck-id="${deckId}"]`);
  }

  private getNewCardsCountEl(deckRowEl: HTMLElement): HTMLElement | null {
    return deckRowEl.querySelector(rowAttributes.newCardsCount.attr);
  }

  private getLearnCardsCountEl(deckRowEl: HTMLElement): HTMLElement | null {
    return deckRowEl.querySelector(rowAttributes.learnCardsCount.attr);
  }

  private getDueCardsCountEl(deckRowEl: HTMLElement): HTMLElement | null {
    return deckRowEl.querySelector(rowAttributes.dueCardsCount.attr);
  }

  private handleDeckRowMouseEnter(event: Event): void {
    const mouseEvent = event as MouseEvent;

    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    const target = mouseEvent.target as HTMLElement | undefined;
    if (!target || !target.parentElement) {
      return;
    }

    target.addClass(visibleClass);
  }

  private handleDeckRowMouseLeave(event: Event): void {
    const mouseEvent = event as MouseEvent;

    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    const target = mouseEvent.target as HTMLElement | null;
    if (!target) {
      return;
    }

    target?.removeClass(visibleClass);
  }

  private renderDecks(): void {
    const decksCardEl = this.rootEl.createDiv('better-recall-card');

    const tableEl = decksCardEl.createEl('table', {
      cls: DECK_TABLE,
    });
    const headerRow = tableEl.createEl('tr');
    headerRow.createEl('th', { text: 'Deck' });
    headerRow.createEl('th', { text: 'New' });
    headerRow.createEl('th', { text: 'Learn' });
    headerRow.createEl('th', { text: 'Due' });

    this.plugin.decksManager.decksArray.forEach((deck) => {
      const deckRowEl = tableEl.createEl('tr', {
        cls: DECK_MAIN,
        attr: {
          'data-deck-id': deck.id,
        },
      });
      const deckDataEl = deckRowEl.createEl('td', {
        cls: DECK_NAME,
      });
      deckRowEl.addEventListener('mouseenter', this.handleDeckRowMouseEnter);
      deckRowEl.addEventListener('mouseleave', this.handleDeckRowMouseLeave);

      const deckNameLink = deckDataEl.createEl('a', {
        text: deck.getName(),
        title: deck.getDescription(),
      });
      deckNameLink.onClickEvent(() => {
        this.recallView.startReviewingDeck(deck);
      });

      this.renderDeckButtons(deckDataEl, deck);

      const newCardsLength = deck.newCards.length;
      const learnCardsLength = deck.learnCards.length;
      const dueCardsLength = deck.dueCards.length;

      deckRowEl.createEl('td', {
        text: `${newCardsLength}`,
        attr: { [rowAttributes.newCardsCount.plain]: newCardsLength },
        cls: newCardsLength > 0 ? NEW_CARDS_COLOR : '',
      });
      deckRowEl.createEl('td', {
        text: `${learnCardsLength}`,
        attr: { [rowAttributes.learnCardsCount.plain]: learnCardsLength },
        cls: learnCardsLength > 0 ? LEARN_CARDS_COLOR : '',
      });
      deckRowEl.createEl('td', {
        text: `${dueCardsLength}`,
        attr: { [rowAttributes.dueCardsCount.plain]: dueCardsLength },
        cls: dueCardsLength > 0 ? DUE_CARDS_COLOR : '',
      });
    });
  }

  private renderDeckButtons(root: HTMLElement, deck: Deck): void {
    const container = root.createDiv('better-recall-deck__buttons');

    const cardsButtonEl = container.createEl('div', {
      cls: DECK_BUTTON,
      attr: {
        role: 'button',
        tabindex: '0',
      },
    });
    const walletCardsIcon = getIcon('wallet-cards');
    if (walletCardsIcon) {
      cardsButtonEl.appendChild(walletCardsIcon);
    }
    cardsButtonEl.onClickEvent(() => {
      new EditCardsModal(this.plugin, deck).open();
    });

    const editButtonEl = container.createEl('div', {
      cls: DECK_BUTTON,
      attr: {
        role: 'button',
        tabindex: '0',
      },
    });
    const penIcon = getIcon('pen');
    if (penIcon) {
      editButtonEl.appendChild(penIcon);
    }
    editButtonEl.onClickEvent(() => {
      new EditDeckModal(this.plugin, deck).open();
    });
  }

  private renderButtons(): void {
    const buttonsBarEl = this.rootEl.createDiv('better-recall-buttons-bar');

    new ButtonComponent(buttonsBarEl)
      .setButtonText('Create Deck')
      .onClick(this.openDeckModal.bind(this));

    new ButtonComponent(buttonsBarEl)
      .setButtonText('Add card')
      .setCta()
      .onClick(() => {
        new AddCardModal(this.plugin).open();
      });
  }

  private renderActivityGraphs(): void {
    const container = this.rootEl.createDiv(
      'better-recall-activity-graphs-container',
    );

    const allCards = this.plugin.decksManager.decksArray.flatMap(
      (deck) => deck.cardsArray,
    );

    const reviewedCounts = this.aggregateDateCounts(
      allCards,
      (card) => card.lastReviewDate,
    );

    const scheduledCounts = this.aggregateDateCounts(
      allCards,
      (card) => card.nextReviewDate,
    );

    this.renderCombinedActivityGraph(
      container,
      reviewedCounts,
      scheduledCounts,
    );
  }

  private aggregateDateCounts(
    cards: SpacedRepetitionItem[],
    dateExtractor: (card: SpacedRepetitionItem) => Date | undefined,
  ): Map<string, number> {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      const date = dateExtractor(card);
      if (date) {
        const key = this.getDateKey(date);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private renderCombinedActivityGraph(
    parent: HTMLElement,
    reviewedCounts: Map<string, number>,
    scheduledCounts: Map<string, number>,
  ): void {
    const wrapper = parent.createDiv('better-recall-activity-graph');
    wrapper.createEl('h4', {
      text: 'Activity',
      cls: 'better-recall-activity-graph__title',
    });

    const gridContainer = wrapper.createDiv(
      'better-recall-activity-graph__grid-container',
    );
    const grid = gridContainer.createDiv('better-recall-activity-graph__grid');

    const tooltip = wrapper.createDiv('better-recall-activity-graph__tooltip');
    const tooltipDate = tooltip.createDiv(
      'better-recall-activity-graph__tooltip-date',
    );
    const tooltipCount = tooltip.createDiv(
      'better-recall-activity-graph__tooltip-count',
    );

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const totalDays =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const maxReviewed = Math.max(...Array.from(reviewedCounts.values()), 1);
    const maxScheduled = Math.max(...Array.from(scheduledCounts.values()), 1);

    for (let week = 0; week < totalWeeks; week++) {
      const column = grid.createDiv('better-recall-activity-graph__column');
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);

        if (currentDate > endDate) {
          break;
        }

        const key = this.getDateKey(currentDate);
        const reviewedCount = reviewedCounts.get(key) || 0;
        const scheduledCount = scheduledCounts.get(key) || 0;
        const dayEl = column.createDiv('better-recall-activity-graph__day');

        let level = 0;
        let colorScale = 'gray';

        if (reviewedCount > 0) {
          colorScale = 'green';
          if (reviewedCount <= maxReviewed * 0.33) {
            level = 1;
          } else if (reviewedCount <= maxReviewed * 0.66) {
            level = 2;
          } else {
            level = 3;
          }
        } else if (scheduledCount > 0) {
          colorScale = 'gray';
          if (scheduledCount <= maxScheduled * 0.33) {
            level = 1;
          } else if (scheduledCount <= maxScheduled * 0.66) {
            level = 2;
          } else {
            level = 3;
          }
        }

        dayEl.addClass(
          `better-recall-activity-graph__day--${colorScale}-${level}`,
        );

        dayEl.addEventListener('mouseenter', () => {
          tooltipDate.setText(key);
          const parts: string[] = [];
          if (reviewedCount > 0) {
            parts.push(`${reviewedCount} reviewed`);
          }
          if (scheduledCount > 0) {
            parts.push(`${scheduledCount} scheduled`);
          }
          tooltipCount.setText(
            parts.length > 0 ? parts.join(' · ') : 'No activity',
          );
          tooltip.addClass('better-recall-activity-graph__tooltip--visible');
          this.positionTooltip(tooltip, dayEl, wrapper);
        });

        dayEl.addEventListener('mouseleave', () => {
          tooltip.removeClass('better-recall-activity-graph__tooltip--visible');
        });
      }
    }

    const legendContainer = wrapper.createDiv(
      'better-recall-activity-graph__legend-container',
    );

    const reviewedLegend = legendContainer.createDiv(
      'better-recall-activity-graph__legend',
    );
    reviewedLegend.createSpan({
      text: 'Less',
      cls: 'better-recall-activity-graph__legend-label',
    });
    for (let i = 0; i <= 3; i++) {
      reviewedLegend.createDiv({
        cls: `better-recall-activity-graph__day better-recall-activity-graph__day--green-${i}`,
      });
    }
    reviewedLegend.createSpan({
      text: 'More',
      cls: 'better-recall-activity-graph__legend-label',
    });
    reviewedLegend.createSpan({
      text: '(Reviewed)',
      cls: 'better-recall-activity-graph__legend-sublabel',
    });

    const scheduledLegend = legendContainer.createDiv(
      'better-recall-activity-graph__legend',
    );
    scheduledLegend.createSpan({
      text: 'Less',
      cls: 'better-recall-activity-graph__legend-label',
    });
    for (let i = 0; i <= 3; i++) {
      scheduledLegend.createDiv({
        cls: `better-recall-activity-graph__day better-recall-activity-graph__day--gray-${i}`,
      });
    }
    scheduledLegend.createSpan({
      text: 'More',
      cls: 'better-recall-activity-graph__legend-label',
    });
    scheduledLegend.createSpan({
      text: '(Scheduled)',
      cls: 'better-recall-activity-graph__legend-sublabel',
    });
  }

  private positionTooltip(
    tooltip: HTMLElement,
    target: HTMLElement,
    wrapper: HTMLElement,
  ): void {
    const targetRect = target.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left =
      targetRect.left -
      wrapperRect.left +
      targetRect.width / 2 -
      tooltipRect.width / 2;
    let top = targetRect.top - wrapperRect.top - tooltipRect.height - 6;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  public onClose(): void {
    this.plugin.getEventEmitter().off('addDeck', this.boundAddDeck);
    this.plugin.getEventEmitter().off('editDeck', this.boundEditDeck);
    this.plugin.getEventEmitter().off('addItem', this.boundAddItem);
    this.plugin.getEventEmitter().off('deleteItem', this.boundDeleteItem);
    this.plugin.getEventEmitter().off('deleteDeck', this.boundDeleteDeck);

    const deckRowEls = this.rootEl.querySelectorAll('.better-recall-deck');
    deckRowEls.forEach((deckRowEl) => {
      deckRowEl.removeEventListener('mouseenter', this.handleDeckRowMouseEnter);
      deckRowEl.removeEventListener('mouseleave', this.handleDeckRowMouseLeave);
    });
  }
}
