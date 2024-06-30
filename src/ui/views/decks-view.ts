import { ButtonComponent, getIcon } from 'obsidian';
import { RecallSubView } from './sub-view';
import BetterRecallPlugin from 'src/main';
import { RecallView } from '.';
import { EditDeckModal } from '../modals/edit-deck-modal';
import { Deck } from 'src/data/deck';
import { AddCardModal } from '../modals/add-card-modal';
import {
  DUE_CARDS_COLOR,
  LEARN_CARDS_COLOR,
  NEW_CARDS_COLOR,
} from '../classes';

const visibleClass = 'better-recall-deck-action--visible';
const rowAttributes = {
  newCardsCount: {
    plain: 'data-new-cards-count',
    attr: '[data-new-cards-count]',
  },
};

export class DecksView extends RecallSubView {
  private rootEl: HTMLElement;

  constructor(plugin: BetterRecallPlugin, recallView: RecallView) {
    super(plugin, recallView);

    this.plugin.getEventEmitter().on('addDeck', () => {
      this.recallView.rootEl.empty();
      this.render();
    });
    this.plugin.getEventEmitter().on('editDeck', ({ payload }) => {
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
    });
    this.plugin.getEventEmitter().on('addItem', ({ payload }) => {
      if (!payload) {
        return;
      }

      const { deckId } = payload;

      // Update items count in `new cards` column.
      const deckRowEl = this.getDeckRowEl(deckId);
      if (!deckRowEl) {
        return;
      }

      const newCardsCountEl = this.getNewCardsCountEl(deckRowEl);
      if (!newCardsCountEl) {
        return;
      }

      const currentCountValue = newCardsCountEl.getAttribute(
        rowAttributes.newCardsCount.plain,
      );
      if (!currentCountValue) {
        return;
      }

      const currentCount = parseInt(currentCountValue);
      const newCount = currentCount + 1;
      if (newCount >= 0) {
        newCardsCountEl.addClass(NEW_CARDS_COLOR);
      }
      newCardsCountEl.setText(String(newCount));
      newCardsCountEl.setAttribute(
        rowAttributes.newCardsCount.plain,
        String(newCount),
      );
    });
  }

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv('better-recall-decks-view');

    this.renderDecks();
    this.renderButtons();
  }

  private getDeckRowEl(deckId: string): HTMLElement | null {
    return this.recallView.rootEl.querySelector(`[data-deck-id="${deckId}"]`);
  }

  private getNewCardsCountEl(deckRowEl: HTMLElement): HTMLElement | null {
    return deckRowEl.querySelector(rowAttributes.newCardsCount.attr);
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
      cls: 'better-recall-deck-table',
    });
    const headerRow = tableEl.createEl('tr');
    headerRow.createEl('th', { text: 'Deck' });
    headerRow.createEl('th', { text: 'New' });
    headerRow.createEl('th', { text: 'Learn' });
    headerRow.createEl('th', { text: 'Due' });

    this.plugin.decksManager.decksArray.forEach((deck) => {
      const deckRowEl = tableEl.createEl('tr', {
        cls: 'better-recall-deck',
        attr: {
          'data-deck-id': deck.id,
        },
      });
      const deckDataEl = deckRowEl.createEl('td', {
        cls: 'better-recall-deck-name',
      });
      deckRowEl.addEventListener('mouseenter', this.handleDeckRowMouseEnter);
      deckRowEl.addEventListener('mouseleave', this.handleDeckRowMouseLeave);

      deckDataEl.createEl('a', {
        text: deck.getName(),
        title: deck.getDescription(),
      });

      this.renderEditButton(deckDataEl, deck);

      const newItemsLength = deck.newItems.length;
      const learnItemsLength = deck.learnItems.length;
      const dueItemsLength = deck.dueItems.length;

      deckRowEl.createEl('td', {
        text: `${newItemsLength}`,
        attr: { [rowAttributes.newCardsCount.plain]: newItemsLength },
        cls: newItemsLength > 0 ? NEW_CARDS_COLOR : '',
      });
      deckRowEl.createEl('td', {
        text: `${learnItemsLength}`,
        attr: { 'data-learn-cards-count': learnItemsLength },
        cls: learnItemsLength > 0 ? LEARN_CARDS_COLOR : '',
      });
      deckRowEl.createEl('td', {
        text: `${dueItemsLength}`,
        attr: { 'data-due-cards-count': dueItemsLength },
        cls: dueItemsLength > 0 ? DUE_CARDS_COLOR : '',
      });
    });
  }

  private renderEditButton(el: HTMLElement, deck: Deck): void {
    const buttonEl = el.createEl('div', {
      cls: 'better-recall-deck__edit-button',
      attr: {
        role: 'button',
        tabindex: '0',
      },
    });
    const penIcon = getIcon('pen');
    if (penIcon) {
      buttonEl.appendChild(penIcon);
    }
    buttonEl.onClickEvent(() => {
      new EditDeckModal(this.plugin, deck).open();
    });
  }

  private renderButtons(): void {
    const buttonsBarEl = this.rootEl.createDiv('better-recall-buttons-bar');
    buttonsBarEl.style.marginTop = '1rem';

    new ButtonComponent(buttonsBarEl)
      .setButtonText('Create Deck')
      .onClick(this.openDeckModal.bind(this));

    new ButtonComponent(buttonsBarEl)
      .setButtonText('Add Card')
      .setCta()
      .onClick(() => {
        new AddCardModal(this.plugin).open();
      });
  }

  public onClose(): void {
    const deckRowEls = this.rootEl.querySelectorAll('.better-recall-deck');
    deckRowEls.forEach((deckRowEl) => {
      deckRowEl.removeEventListener('mouseenter', this.handleDeckRowMouseEnter);
      deckRowEl.removeEventListener('mouseleave', this.handleDeckRowMouseLeave);
    });
  }
}
