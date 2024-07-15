import BetterRecallPlugin from 'src/main';
import { CardModal } from './CardModal';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { Deck } from 'src/data/deck';
import { ButtonComponent } from 'obsidian';

export class EditCardModal extends CardModal {
  constructor(
    protected plugin: BetterRecallPlugin,
    private deck: Deck,
    private card: SpacedRepetitionItem,
  ) {
    super(plugin);
    this.setTitle('Edit Card');
  }

  protected render(): void {
    this.renderCardTypeDropdown();

    this.renderDeckDropdown();

    this.renderBasicTypeFields(this.card.content.front, this.card.content.back);

    const buttonsContainer = this.contentEl.createDiv(
      'better-recall__buttons-container',
    );
    // Create custom delete button.
    const deleteButton = new ButtonComponent(buttonsContainer)
      .setButtonText('Delete')
      .onClick(() => this.deleteCard());
    deleteButton.buttonEl.style.marginTop = 'var(--size-4-5)';
    this.renderButtonsBar('Save', { container: buttonsContainer });
  }

  private deleteCard(): void {
    this.plugin.decksManager.removeCard(this.deck.id, this.card.id);
    this.plugin
      .getEventEmitter()
      .emit('deleteItem', { deckId: this.deck.id, deletedItem: this.card });
    this.close();
  }

  protected submit(): void {
    const deckId = this.deckDropdownComp.getValue();
    const front = this.frontInputComp.getValue();
    const back = this.backInputComp.getValue();

    this.frontInputComp.setValue('');
    this.backInputComp.setValue('');

    const updatedCard = {
      ...this.card,
      content: {
        front,
        back,
      },
    };

    if (deckId === this.deck.id) {
      this.plugin.decksManager.updateCardContent(deckId, updatedCard);
    } else {
      // Remove the card from the old assigned deck.
      this.plugin.decksManager.removeCard(deckId, updatedCard.id);
      // Add card to the new assigned deck.
      this.plugin.decksManager.addCard(deckId, updatedCard);
    }

    this.plugin
      .getEventEmitter()
      .emit('editItem', { deckId, newItem: updatedCard });

    this.close();
  }
}
