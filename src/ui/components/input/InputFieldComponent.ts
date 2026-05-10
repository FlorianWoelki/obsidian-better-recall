import { TextComponent } from 'obsidian';
import { createDescriptionEl } from './utils';

interface InputFieldComponentOptions {
  description?: string;
}

export class InputFieldComponent extends TextComponent {
  public descriptionEl?: HTMLElement;

  constructor(
    private contentEl: HTMLElement,
    private options?: InputFieldComponentOptions,
  ) {
    super(contentEl);
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
  }
}
