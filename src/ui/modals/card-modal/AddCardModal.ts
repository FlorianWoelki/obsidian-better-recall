import { v4 as uuidv4 } from 'uuid';
import BetterRecallPlugin from '../../../main';
import { CardModal } from './CardModal';

export class AddCardModal extends CardModal {
  constructor(protected plugin: BetterRecallPlugin) {
    super(plugin);
    this.setTitle('Add card');
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

    const card = this.plugin.algorithm.createNewCard(uuidv4(), {
      front,
      back,
    });

    this.plugin.decksManager.addCard(deckId, card);
    this.plugin
      .getEventEmitter()
      .emit('addItem', { deckId: deckId, item: card });
  }
}
