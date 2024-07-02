import { v4 as uuidv4 } from 'uuid';
import BetterRecallPlugin from '../../../main';
import {
  CardState,
  CardType,
  SpacedRepetitionItem,
} from 'src/spaced-repetition';
import { CardModal } from './card-modal';

export class AddCardModal extends CardModal {
  constructor(protected plugin: BetterRecallPlugin) {
    super(plugin);
    this.setTitle('Add Card');
  }

  protected render(): void {
    this.renderCardTypeDropdown();

    this.renderDeckDropdown();

    this.renderBasicTypeFields();

    this.renderButtonsBar('Add');
  }

  protected submit(): void {
    const deckId = this.deckDropdownComp.getValue();
    const front = this.frontInputComp.getValue();
    const back = this.backInputComp.getValue();

    this.frontInputComp.setValue('');
    this.backInputComp.setValue('');

    // TODO: Refactor, make it easier
    const card: SpacedRepetitionItem = {
      id: uuidv4(),
      type: CardType.BASIC,
      content: {
        front,
        back,
      },
      state: CardState.NEW,
      easeFactor: 2.5,
      interval: 0,
      iteration: 0,
      stepIndex: 0,
    };
    this.plugin.decksManager.addItem(deckId, card);
    this.plugin
      .getEventEmitter()
      .emit('addItem', { deckId: deckId, item: card });
  }
}
