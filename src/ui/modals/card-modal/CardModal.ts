import { DropdownComponent, Modal } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ButtonsBarComponent } from 'src/ui/components/ButtonsBarComponent';
import { InputAreaComponent } from 'src/ui/components/input/InputAreaComponent';

export abstract class CardModal extends Modal {
  private optionsContainerEl: HTMLElement;

  protected deckDropdownComp: DropdownComponent;
  protected frontInputComp: InputAreaComponent;
  protected backInputComp: InputAreaComponent;
  protected buttonsBarComp: ButtonsBarComponent;

  constructor(protected plugin: BetterRecallPlugin) {
    super(plugin.app);
  }

  onOpen(): void {
    super.onOpen();

    this.optionsContainerEl = this.contentEl.createDiv(
      'better-recall-card__add-options',
    );

    this.render();
  }

  onClose(): void {
    this.frontInputComp.keyboardListener.cleanup();
    this.backInputComp.keyboardListener.cleanup();
    super.onClose();
    this.plugin.decksManager.save();
    this.contentEl.empty();
  }

  protected abstract render(): void;

  protected abstract submit(): void;

  protected renderDeckDropdown(): void {
    const decks = Object.entries(this.plugin.decksManager.getDecks()).reduce<
      Record<string, string>
    >((curr, [id, deck]) => {
      curr[id] = deck.getName();
      return curr;
    }, {});

    // Renders the deck dropdown.
    this.optionsContainerEl.createEl('p', {
      text: 'Deck:',
      cls: 'setting-item-description better-recall-card-modal-description',
    });
    this.deckDropdownComp = new DropdownComponent(
      this.optionsContainerEl,
    ).addOptions(decks);
    this.deckDropdownComp.selectEl.addClass('better-recall-field');
  }

  protected renderCardTypeDropdown(): void {
    this.optionsContainerEl.createEl('p', {
      text: 'Type:',
      cls: 'setting-item-description better-recall-card-modal-description',
    });
    const cardTypeDropdown = new DropdownComponent(this.optionsContainerEl)
      .addOptions({ basic: 'Basic' })
      .setDisabled(true);
    cardTypeDropdown.selectEl.addClass('better-recall-field');
  }

  protected renderBasicTypeFields(front?: string, back?: string): void {
    this.frontInputComp = new InputAreaComponent(this.contentEl, {
      description: 'Front',
    })
      .setValue(front ?? '')
      .onChange(this.handleInputChange.bind(this));
    this.frontInputComp.keyboardListener.onEnter = () => {
      if (this.disabled) {
        return;
      }

      this.submit();
    };

    this.backInputComp = new InputAreaComponent(this.contentEl, {
      description: 'Back',
    })
      .setValue(back ?? '')
      .onChange(this.handleInputChange.bind(this));
    this.backInputComp.descriptionEl.addClass('better-recall-back-field');
    this.backInputComp.keyboardListener.onEnter = () => {
      if (this.disabled) {
        return;
      }

      this.submit();
    };
  }

  protected renderButtonsBar(
    submitText: string,
    options: { container?: HTMLElement } = {},
  ): void {
    options.container ??= this.contentEl;
    this.buttonsBarComp = new ButtonsBarComponent(options.container)
      .setSubmitButtonDisabled(true)
      .setSubmitText(submitText)
      .onSubmit(this.submit.bind(this))
      .onClose(this.close.bind(this));
  }

  protected handleInputChange() {
    const disabled =
      this.frontInputComp.getValue().length === 0 ||
      this.backInputComp.getValue().length === 0;
    this.buttonsBarComp.setSubmitButtonDisabled(disabled);
  }

  protected get disabled(): boolean {
    return (
      this.frontInputComp.getValue().length === 0 ||
      this.backInputComp.getValue().length === 0
    );
  }
}
