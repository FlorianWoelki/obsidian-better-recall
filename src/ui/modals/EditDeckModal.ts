import { ButtonComponent, Modal } from 'obsidian';
import { Deck } from '../../data/deck';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../components/ButtonsBarComponent';
import { InputFieldComponent } from '../components/InputFieldComponent';

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
    this.deckNameInputComp.descriptionEl.addClass(
      'better-recall-deck-name-field',
    );

    // Renders the deck description input field.
    this.deckDescriptionInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Deck description:',
    }).setValue(this.deck.getDescription());
    this.deckDescriptionInputComp.descriptionEl.addClass(
      'better-recall-deck-description-field',
    );

    const buttonsContainer = this.contentEl.createDiv(
      'better-recall__buttons-container',
    );
    // Create custom delete button.
    const deleteButton = new ButtonComponent(buttonsContainer)
      .setButtonText('Delete')
      .onClick(() => this.deleteDeck());
    deleteButton.buttonEl.addClass('better-recall-delete-button');

    // Renders the button bar.
    this.buttonsBarComp = new ButtonsBarComponent(buttonsContainer)
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

  private async deleteDeck(): Promise<void> {
    this.buttonsBarComp.setSubmitButtonDisabled(true);
    await this.plugin.decksManager.delete(this.deck.id);
    this.plugin.getEventEmitter().emit('deleteDeck', { deck: this.deck });
    this.close();
  }

  private async editDeck(): Promise<void> {
    this.buttonsBarComp.setSubmitButtonDisabled(true);
    await this.plugin.decksManager.updateInformation(
      this.deck.id,
      this.deckNameInputComp.getValue(),
      this.deckDescriptionInputComp.getValue(),
    );
    this.plugin.getEventEmitter().emit('editDeck', { deck: this.deck });
    this.close();
  }

  onClose(): void {
    this.deckNameInputComp.cleanup();
    this.deckDescriptionInputComp.cleanup();
    super.onClose();
    this.contentEl.empty();
  }
}
