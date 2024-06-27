import { ButtonComponent, Modal, TextComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';

export class CreateDeckModal extends Modal {
  private deckNameInputComp: TextComponent;
  private deckDescriptionInputComp: TextComponent;
  private createButtonComp: ButtonComponent;

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
      this.createButtonComp.setDisabled(value.length === 0);
    });
    this.deckNameInputComp.inputEl.addEventListener('keypress', (event) => {
      setTimeout(() => {
        const isEmpty = (event.target as HTMLInputElement).value.length === 0;

        if (event.key !== 'Enter' || isEmpty) {
          return;
        }

        this.createDeck();
      }, 1);
    });

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

    // Creates the button bar.
    const buttonsBarEl = this.contentEl.createDiv('better-recall-buttons-bar');

    // Creates the buttons for the button bar.
    const cancelButtonComp = new ButtonComponent(buttonsBarEl);
    cancelButtonComp.setButtonText('Cancel');
    cancelButtonComp.onClick(() => this.close());
    this.createButtonComp = new ButtonComponent(buttonsBarEl);
    this.createButtonComp.setCta();
    this.createButtonComp.setButtonText('Create');
    this.createButtonComp.setDisabled(true);
    this.createButtonComp.onClick(async () => {
      await this.createDeck();
    });
  }

  private async createDeck(): Promise<void> {
    this.createButtonComp.setDisabled(true);
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

  onClose(): void {
    super.onClose();
    this.contentEl.empty();
  }
}
