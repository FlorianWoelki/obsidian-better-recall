import { Modal } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';
import { InputFieldComponent } from '../InputFieldComponent';

export class CreateDeckModal extends Modal {
  private deckNameInputComp: InputFieldComponent;
  private deckDescriptionInputComp: InputFieldComponent;
  private buttonsBarComp: ButtonsBarComponent;

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app);
    this.setTitle('Create new Deck');
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
      .setPlaceholder('Algorithms & Datastructures')
      .onChange((value) => {
        this.buttonsBarComp.setSubmitButtonDisabled(value.length === 0);
      });
    this.deckNameInputComp.onEnter = () => {
      this.createDeck();
    };
    this.deckNameInputComp.descriptionEl.style.marginTop = '0';

    // Creates the deck description input field.
    this.deckDescriptionInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Description (optional):',
    }).setPlaceholder('A lovely CS learning experience.');
    this.deckDescriptionInputComp.onEnter = () => {
      if (this.deckNameInputComp.getValue().length === 0) {
        return;
      }

      this.createDeck();
    };
    this.deckDescriptionInputComp.descriptionEl.style.marginTop =
      'var(--size-2-3)';

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
    this.plugin
      .getEventEmitter()
      .emit({ type: 'addDeck', payload: { deck: createdDeck } });
    this.close();
  }

  onClose(): void {
    this.deckNameInputComp.cleanup();
    this.deckDescriptionInputComp.cleanup();
    super.onClose();
    this.contentEl.empty();
  }
}
