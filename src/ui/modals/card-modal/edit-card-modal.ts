import BetterRecallPlugin from 'src/main';
import { CardModal } from './card-modal';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { Deck } from 'src/data/deck';

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

    this.renderButtonsBar('Save');
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
