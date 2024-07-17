import { TextComponent } from 'obsidian';

interface InputFieldComponentOptions {
  description?: string;
}

export class InputFieldComponent extends TextComponent {
  public descriptionEl: HTMLElement;

  constructor(
    private contentEl: HTMLElement,
    private options?: InputFieldComponentOptions,
  ) {
    super(contentEl);
    this.render();
  }

  public onEnter(): void {}

  public cleanup(): void {
    this.removeKeyEnterAction(this.inputEl);
  }

  private render() {
    if (this.options?.description) {
      this.descriptionEl = this.createDescriptionEl(
        this.contentEl,
        this.options.description,
      );
    }

    this.inputEl.classList.add('better-recall-field');
    this.addKeyEnterAction(this.inputEl);
  }

  private createDescriptionEl(
    container: HTMLElement,
    text: string,
  ): HTMLElement {
    const descriptionEl = container.createEl('p', {
      text,
      cls: 'setting-item-description better-recall-description',
    });
    container.insertBefore(descriptionEl, this.inputEl);
    return descriptionEl;
  }

  private addKeyEnterAction(inputEl: HTMLInputElement): void {
    inputEl.addEventListener('keypress', this.onEnterPress.bind(this));
  }

  private removeKeyEnterAction(inputEl: HTMLInputElement): void {
    inputEl.removeEventListener('keypress', this.onEnterPress.bind(this));
  }

  private onEnterPress(event: KeyboardEvent): void {
    setTimeout(() => {
      const isEmpty = this.getValue().length === 0;

      if (event.key !== 'Enter' || isEmpty) {
        return;
      }

      this.onEnter();
    }, 1);
  }
}
