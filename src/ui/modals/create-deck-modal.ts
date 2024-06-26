import { ButtonComponent, Modal, TextComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';

export class CreateDeckModal extends Modal {
  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app);
    this.setTitle('Create new Deck');
  }

  onOpen(): void {
    super.onOpen();
    this.render();
  }

  private render(): void {
    // Creates the input field.
    const descriptionEl = this.createDescriptionEl(
      this.contentEl,
      'New deck name:',
    );
    descriptionEl.style.marginTop = '0';
    const deckNameInputComp = new TextComponent(this.contentEl);
    deckNameInputComp.inputEl.style.width = '100%';
    deckNameInputComp.setPlaceholder('Algorithms & Datastructures');

    // Creates the button bar.
    const buttonsBarEl = this.contentEl.createDiv('better-recall-buttons-bar');

    // Creates the buttons for the button bar.
    const cancelButtonComp = new ButtonComponent(buttonsBarEl);
    cancelButtonComp.setButtonText('Cancel');
    cancelButtonComp.onClick(() => this.close());
    const createButtonComp = new ButtonComponent(buttonsBarEl);
    createButtonComp.setCta();
    createButtonComp.setButtonText('Create');
    createButtonComp.onClick(() => {
      console.log('create deck');
    });
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
