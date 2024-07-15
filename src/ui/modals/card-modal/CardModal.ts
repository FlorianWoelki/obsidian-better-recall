import { DropdownComponent, Modal } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ButtonsBarComponent } from 'src/ui/components/ButtonsBarComponent';
import { InputFieldComponent } from 'src/ui/components/InputFieldComponent';

export abstract class CardModal extends Modal {
  private optionsContainerEl: HTMLElement;

  protected deckDropdownComp: DropdownComponent;
  protected frontInputComp: InputFieldComponent;
  protected backInputComp: InputFieldComponent;
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
    const deckDropdownDescriptionEl = this.optionsContainerEl.createEl('p', {
      text: 'Deck:',
      cls: 'setting-item-description',
    });
    deckDropdownDescriptionEl.style.paddingTop = '0';
    this.deckDropdownComp = new DropdownComponent(
      this.optionsContainerEl,
    ).addOptions(decks);
    this.deckDropdownComp.selectEl.style.width = '100%';
  }

  protected renderCardTypeDropdown(): void {
    const cardTypeDropdownDescriptionEl = this.optionsContainerEl.createEl(
      'p',
      {
        text: 'Type:',
        cls: 'setting-item-description',
      },
    );
    cardTypeDropdownDescriptionEl.style.paddingTop = '0';
    const cardTypeDropdown = new DropdownComponent(this.optionsContainerEl)
      .addOptions({ basic: 'Basic' })
      .setDisabled(true);
    cardTypeDropdown.selectEl.style.width = '100%';
  }

  protected renderBasicTypeFields(front?: string, back?: string): void {
    this.frontInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Front',
    })
      .setValue(front ?? '')
      .onChange(this.handleInputChange.bind(this));

    this.backInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Back',
    })
      .setValue(back ?? '')
      .onChange(this.handleInputChange.bind(this));
    this.backInputComp.descriptionEl.style.marginTop = 'var(--size-2-3)';
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
}
