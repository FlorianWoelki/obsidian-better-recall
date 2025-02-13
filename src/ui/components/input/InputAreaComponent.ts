import { TextAreaComponent } from 'obsidian';
import { KeyboardListener } from './KeyboardListener';
import { createDescriptionEl } from './utils';

interface InputAreaComponentOptions {
  description?: string;
}

export class InputAreaComponent extends TextAreaComponent {
  public descriptionEl: HTMLElement;

  public keyboardListener: KeyboardListener;

  constructor(
    private contentEl: HTMLElement,
    private options?: InputAreaComponentOptions,
  ) {
    super(contentEl);
    this.inputEl.rows = 5;
    this.inputEl.style.resize = 'none';
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
