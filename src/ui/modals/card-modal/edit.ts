import BetterRecallPlugin from 'src/main';
import { CardModal } from './card-modal';
import { SpacedRepetitionItem } from 'src/spaced-repetition';
import { Deck } from 'src/data/deck';

export class EditCardModal extends CardModal {
  constructor(
    protected plugin: BetterRecallPlugin,
    private deck: Deck,
    private item: SpacedRepetitionItem,
  ) {
    super(plugin);
    this.setTitle('Edit Card');
  }

  protected render(): void {
    this.renderCardTypeDropdown();

    this.renderDeckDropdown();

    this.renderBasicTypeFields(this.item.content.front, this.item.content.back);

    this.renderButtonsBar('Save');
  }

  protected submit(): void {
    const deckId = this.deckDropdownComp.getValue();
    const front = this.frontInputComp.getValue();
    const back = this.backInputComp.getValue();

    this.frontInputComp.setValue('');
    this.backInputComp.setValue('');

    this.item = {
      ...this.item,
      content: {
        front,
        back,
      },
    };

    if (deckId === this.deck.id) {
      console.log(deckId);
    } else {
      console.log(deckId);
    }
  }
}
