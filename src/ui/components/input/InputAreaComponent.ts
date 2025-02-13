import { TextAreaComponent } from 'obsidian';
import { createDescriptionEl } from './utils';

interface InputAreaComponentOptions {
  description?: string;
}

export class InputAreaComponent extends TextAreaComponent {
  public descriptionEl: HTMLElement;

  constructor(
    private contentEl: HTMLElement,
    private options?: InputAreaComponentOptions,
  ) {
    super(contentEl);
    this.inputEl.rows = 5;
    this.inputEl.style.resize = 'none';
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
