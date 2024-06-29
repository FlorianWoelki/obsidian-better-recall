import { ButtonComponent, Component } from 'obsidian';

const BUTTONS_BAR_CLASS = 'better-recall-buttons-bar';

export class ButtonsBarComponent extends Component {
  private submitButtonComp: ButtonComponent;
  private cancelButtonComp: ButtonComponent;

  constructor(private contentEl: HTMLElement) {
    super();
    this.render();
  }

  public onClose(cb: () => void): ButtonsBarComponent {
    this.cancelButtonComp.onClick(cb);
    return this;
  }

  public onSubmit(cb: () => void): ButtonsBarComponent {
    this.submitButtonComp.onClick(cb);
    return this;
  }

  private render(): void {
    // Creates the button bar.
    const buttonsBarEl = this.contentEl.createDiv(BUTTONS_BAR_CLASS);

    // Creates the buttons for the button bar.
    this.cancelButtonComp = new ButtonComponent(buttonsBarEl);
    this.cancelButtonComp.setButtonText('Cancel');
    this.submitButtonComp = new ButtonComponent(buttonsBarEl);
    this.submitButtonComp.setCta();
    this.submitButtonComp.setButtonText('Save');
    this.submitButtonComp.setDisabled(true);
  }

  public setSubmitButtonDisabled(disabled: boolean): ButtonsBarComponent {
    this.submitButtonComp.setDisabled(disabled);
    return this;
  }

  public setSubmitText(text: string): ButtonsBarComponent {
    this.submitButtonComp.setButtonText(text);
    return this;
  }
}
