import { Modal, TextComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';

export class CreateDeckModal extends Modal {
  private deckNameInputComp: TextComponent;
  private deckDescriptionInputComp: TextComponent;
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
    let descriptionEl = this.createDescriptionEl(
      this.contentEl,
      'New deck name:',
    );
    descriptionEl.style.marginTop = '0';
    this.deckNameInputComp = new TextComponent(this.contentEl);
    this.deckNameInputComp.inputEl.style.width = '100%';
    this.deckNameInputComp.setPlaceholder('Algorithms & Datastructures');
    this.deckNameInputComp.onChange((value) => {
      this.buttonsBarComp.setSubmitButtonDisabled(value.length === 0);
    });
    this.addKeyEnterAction(this.deckNameInputComp.inputEl);

    // Creates the deck description input field.
    descriptionEl = this.createDescriptionEl(
      this.contentEl,
      'Description (optional):',
    );
    descriptionEl.style.marginTop = 'var(--size-2-3)';
    this.deckDescriptionInputComp = new TextComponent(this.contentEl);
    this.deckDescriptionInputComp.inputEl.style.width = '100%';
    this.deckDescriptionInputComp.setPlaceholder(
      'A lovely CS learning experience.',
    );
    this.addKeyEnterAction(this.deckDescriptionInputComp.inputEl);

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

  private createDescriptionEl(
    container: HTMLElement,
    text: string,
  ): HTMLElement {
    const descriptionEl = container.createEl('p', {
      text,
      cls: 'setting-item-description',
    });
    descriptionEl.style.marginBottom = 'var(--size-2-2)';
    return descriptionEl;
  }

  private onEnterPress(event: KeyboardEvent): void {
    setTimeout(() => {
      const isEmpty = this.deckNameInputComp.getValue().length === 0;

      if (event.key !== 'Enter' || isEmpty) {
        return;
      }

      this.createDeck();
    }, 1);
  }

  private addKeyEnterAction(inputEl: HTMLInputElement): void {
    inputEl.addEventListener('keypress', this.onEnterPress.bind(this));
  }

  private removeKeyEnterAction(inputEl: HTMLInputElement): void {
    inputEl.removeEventListener('keypress', this.onEnterPress.bind(this));
  }

  onClose(): void {
    this.removeKeyEnterAction(this.deckNameInputComp.inputEl);
    this.removeKeyEnterAction(this.deckDescriptionInputComp.inputEl);
    super.onClose();
    this.contentEl.empty();
  }
}
