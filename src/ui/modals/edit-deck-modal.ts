import { Modal } from 'obsidian';
import { Deck } from '../../data/deck';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';
import { InputFieldComponent } from '../InputFieldComponent';

export class EditDeckModal extends Modal {
  private buttonsBarComp: ButtonsBarComponent;
  private deckNameInputComp: InputFieldComponent;
  private deckDescriptionInputComp: InputFieldComponent;

  constructor(
    private plugin: BetterRecallPlugin,
    private deck: Deck,
  ) {
    super(plugin.app);
    this.setTitle(`Edit Deck "${deck.getName()}"`);
  }

  onOpen(): void {
    super.onOpen();
    this.render();
  }

  private render(): void {
    // Renders the deck name input field.
    this.deckNameInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Deck name:',
    })
      .setValue(this.deck.getName())
      .onChange((value) => {
        this.buttonsBarComp.setSubmitButtonDisabled(value.length === 0);
      });
    this.deckNameInputComp.descriptionEl.style.marginTop = '0';

    // Renders the deck description input field.
    this.deckDescriptionInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Deck description:',
    }).setValue(this.deck.getDescription());
    this.deckDescriptionInputComp.descriptionEl.style.marginTop =
      'var(--size-2-3)';

    // Renders the button bar.
    this.buttonsBarComp = new ButtonsBarComponent(this.contentEl)
      .setSubmitText('Save')
      .setSubmitButtonDisabled(false)
      .onClose(this.close.bind(this))
      .onSubmit(async () => {
        if (this.deckNameInputComp.getValue().length === 0) {
          return;
        }

        await this.editDeck();
      });
  }

  private async editDeck(): Promise<void> {
    this.buttonsBarComp.setSubmitButtonDisabled(true);
    await this.plugin.decksManager.updateInformation(
      this.deck.id,
      this.deckNameInputComp.getValue(),
      this.deckDescriptionInputComp.getValue(),
    );
    this.plugin
      .getEventEmitter()
      .emit({ type: 'editDeck', payload: { deck: this.deck } });
    this.close();
  }

  onClose(): void {
    this.deckNameInputComp.cleanup();
    this.deckDescriptionInputComp.cleanup();
    super.onClose();
    this.contentEl.empty();
  }
}
