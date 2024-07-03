import { ButtonComponent, Component } from 'obsidian';
import { BUTTONS_BAR_CLASS } from '../classes';

export class ButtonsBarComponent extends Component {
  private submitButtonComp: ButtonComponent;
  private closeButtonComp: ButtonComponent;
  public buttonsBarEl: HTMLDivElement;

  constructor(private contentEl: HTMLElement) {
    super();
    this.render();
  }

  public onClose(cb: () => void): ButtonsBarComponent {
    this.closeButtonComp.onClick(cb);
    return this;
  }

  public onSubmit(cb: () => void): ButtonsBarComponent {
    this.submitButtonComp.onClick(cb);
    return this;
  }

  private render(): void {
    // Creates the button bar.
    this.buttonsBarEl = this.contentEl.createDiv(BUTTONS_BAR_CLASS);

    // Creates the buttons for the button bar.
    this.closeButtonComp = new ButtonComponent(this.buttonsBarEl);
    this.closeButtonComp.setButtonText('Cancel');
    this.submitButtonComp = new ButtonComponent(this.buttonsBarEl);
    this.submitButtonComp.setCta();
    this.submitButtonComp.setButtonText('Save');
    this.submitButtonComp.setDisabled(true);
  }

  public setCloseButtonText(text: string): ButtonsBarComponent {
    this.closeButtonComp.setButtonText(text);
    return this;
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
