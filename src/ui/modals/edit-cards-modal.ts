import { Modal } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';
import { Deck } from 'src/data/deck';
import { AddCardModal } from './card-modal/add';
import { EditCardModal } from './card-modal/edit';

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
  }

  private render(): void {
    // Renders the list of cards with edit buttons.
    const decksCardEl = this.contentEl.createDiv(
      'better-recall-card better-recall__cards-list',
    );

    this.deck.cardsArray.forEach((card) => {
      const cardEl = decksCardEl.createEl('div', {
        text: `${card.content.front} :: ${card.content.back}`,
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
    this.buttonsBarComp.buttonsBarEl.style.paddingTop = 'var(--size-4-2)';
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
