import { Modal } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../components/ButtonsBarComponent';
import { Deck } from 'src/data/deck';
import { AddCardModal } from './card-modal/add-card-modal';
import { EditCardModal } from './card-modal/edit-card-modal';

const cardAttributes = {
  cardId: 'data-card-id',
};

export class EditCardsModal extends Modal {
  private buttonsBarComp: ButtonsBarComponent;

  constructor(
    private plugin: BetterRecallPlugin,
    private deck: Deck,
  ) {
    super(plugin.app);
    this.setTitle(`Cards from "${deck.getName()}"`);
  }

  onOpen(): void {
    super.onOpen();
    this.render();

    this.plugin.getEventEmitter().on('editItem', ({ payload }) => {
      if (!payload) {
        return;
      }

      const { newItem } = payload;

      const cardEl = this.contentEl.querySelector(
        `[${cardAttributes.cardId}="${newItem.id}"]`,
      );
      if (!cardEl) {
        return;
      }

      this.contentEl.empty();
      this.render();
    });
  }

  private render(): void {
    // Renders the list of cards with edit buttons.
    const decksCardEl = this.contentEl.createDiv(
      'better-recall-card better-recall__cards-list',
    );

    this.deck.cardsArray.forEach((card) => {
      const cardEl = decksCardEl.createEl('div', {
        text: `${card.content.front} :: ${card.content.back}`,
        attr: {
          [cardAttributes.cardId]: card.id,
        },
      });
      cardEl.onClickEvent(() => {
        new EditCardModal(this.plugin, this.deck, card).open();
      });
    });

    // Renders buttons bar component.
    this.buttonsBarComp = new ButtonsBarComponent(this.contentEl)
      .setSubmitButtonDisabled(false)
      .setSubmitText('Add Card')
      .onSubmit(this.openAddCardModal.bind(this))
      .onClose(this.close.bind(this));
  }

  private openAddCardModal(): void {
    new AddCardModal(this.plugin).open();
  }

  onClose(): void {
    super.onClose();
    this.plugin.decksManager.save();
    this.contentEl.empty();
  }
}
