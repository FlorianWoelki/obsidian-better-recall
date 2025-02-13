import { TextComponent } from 'obsidian';
import { KeyboardListener } from './KeyboardListener';
import { createDescriptionEl } from './utils';

interface InputFieldComponentOptions {
  description?: string;
}

export class InputFieldComponent extends TextComponent {
  public descriptionEl: HTMLElement;

  public keyboardListener: KeyboardListener;

  constructor(
    private contentEl: HTMLElement,
    private options?: InputFieldComponentOptions,
  ) {
    super(contentEl);
    this.keyboardListener = new KeyboardListener(this.inputEl);
    this.render();
  }

  private render() {
    if (this.options?.description) {
      this.descriptionEl = createDescriptionEl(
        this.contentEl,
        this.inputEl,
        this.options.description,
      );
    }

    this.inputEl.classList.add('better-recall-field');
    this.keyboardListener.addKeyEnterAction();
  }
}
