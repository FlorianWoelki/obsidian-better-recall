import { Modal } from 'obsidian';
import { Deck } from '../../data/deck';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';

export class EditDeckModal extends Modal {
  constructor(
    private plugin: BetterRecallPlugin,
    private deck: Deck,
  ) {
    super(plugin.app);
    this.setTitle(`Edit Deck "${deck.name}"`);
  }

  onOpen(): void {
    super.onOpen();
    this.render();
  }

  private render(): void {
    new ButtonsBarComponent(this.contentEl)
      .setSubmitText('Save')
      .setSubmitButtonDisabled(true)
      .onClose(this.close.bind(this))
      .onSubmit(() => {
        // TODO: Edit modal
      });
  }

  onClose(): void {
    super.onClose();
    this.contentEl.empty();
  }
}
