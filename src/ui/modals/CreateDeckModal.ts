import { Modal } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ButtonsBarComponent } from '../components/ButtonsBarComponent';
import { InputFieldComponent } from '../components/input/InputFieldComponent';

export class CreateDeckModal extends Modal {
  private deckNameInputComp: InputFieldComponent;
  private deckDescriptionInputComp: InputFieldComponent;
  private buttonsBarComp: ButtonsBarComponent;

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app);
    this.setTitle('Create new deck');
  }

  onOpen(): void {
    super.onOpen();
    this.render();
  }

  private render(): void {
    // Creates the deck name input field.
    this.deckNameInputComp = new InputFieldComponent(this.contentEl, {
      description: 'New deck name:',
    })
      .setPlaceholder('Algorithms & datastructures')
      .onChange((value) => {
        this.buttonsBarComp.setSubmitButtonDisabled(value.length === 0);
      });
    this.deckNameInputComp.keyboardListener.onEnter = () => {
      this.createDeck();
    };
    this.deckNameInputComp.descriptionEl.addClass(
      'better-recall-deck-name-field',
    );

    // Creates the deck description input field.
    this.deckDescriptionInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Description (optional):',
    }).setPlaceholder('A lovely CS learning experience.');
    this.deckDescriptionInputComp.keyboardListener.onEnter = () => {
      if (this.deckNameInputComp.getValue().length === 0) {
        return;
      }

      this.createDeck();
    };
    this.deckDescriptionInputComp.descriptionEl.addClass(
      'better-recall-deck-description-field',
    );

    // Creates the buttons bar.
    this.buttonsBarComp = new ButtonsBarComponent(this.contentEl)
      .setSubmitText('Create')
      .setSubmitButtonDisabled(true)
      .onClose(this.close.bind(this))
      .onSubmit(async () => {
        await this.createDeck();
      });
  }

  private async createDeck(): Promise<void> {
    this.buttonsBarComp.setSubmitButtonDisabled(true);
    const createdDeck = await this.plugin.decksManager.create(
      this.deckNameInputComp.getValue(),
      this.deckDescriptionInputComp.getValue(),
    );
    this.plugin.getEventEmitter().emit('addDeck', { deck: createdDeck });
    this.close();
  }

  onClose(): void {
    this.deckNameInputComp.keyboardListener.cleanup();
    this.deckDescriptionInputComp.keyboardListener.cleanup();
    super.onClose();
    this.contentEl.empty();
  }
}
