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
import { AddItemEvent, EditDeckEvent } from 'src/data/event/events';

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
  private rootEl: HTMLElement;

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

  private handleDeleteItem({ payload }: AddItemEvent): void {
    if (!payload) {
      return;
    }

    const { deckId } = payload;

    const deckRowEl = this.getDeckRowEl(deckId);
    if (!deckRowEl) {
      return;
    }

    this.refreshNewCardsCount(deckId, deckRowEl);
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

  private handleDeckRowMouseEnter(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement | undefined;
    if (!target || !target.parentElement) {
      return;
    }

    target.addClass(visibleClass);
  }

  private handleDeckRowMouseLeave(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement | null;
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
      .onClick(this.openDeckModal);

    new ButtonComponent(buttonsBarEl)
      .setButtonText('Add card')
      .setCta()
      .onClick(() => {
        new AddCardModal(this.plugin).open();
      });
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
