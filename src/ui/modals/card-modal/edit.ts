import BetterRecallPlugin from 'src/main';
import { CardModal } from './card-modal';
import { SpacedRepetitionItem } from 'src/spaced-repetition';

export class EditCardModal extends CardModal {
  constructor(
    protected plugin: BetterRecallPlugin,
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

  protected submit(): void {}
}
