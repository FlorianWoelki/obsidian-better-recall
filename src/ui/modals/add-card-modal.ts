import { DropdownComponent, Modal } from 'obsidian';
import BetterRecallPlugin from '../../main';
import { ButtonsBarComponent } from '../ButtonsBarComponent';
import { InputFieldComponent } from '../InputFieldComponent';

export class AddCardModal extends Modal {
  private deckDropdownComp: DropdownComponent;
  private frontInputComp: InputFieldComponent;
  private backInputComp: InputFieldComponent;
  private buttonsBarComp: ButtonsBarComponent;

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app);
    this.setTitle('Add Card');
  }

  onOpen(): void {
    super.onOpen();
    this.render();
  }

  private render(): void {
    const decks = Object.entries(this.plugin.decksManager.getDecks()).reduce<
      Record<string, string>
    >((curr, [id, deck]) => {
      curr[id] = deck.getName();
      return curr;
    }, {});

    const addOptionsContainerEl = this.contentEl.createDiv(
      'better-recall-card__add-options',
    );

    // Renders the card type dropdown.
    const cardTypeDropdownDescriptionEl = addOptionsContainerEl.createEl('p', {
      text: 'Type:',
      cls: 'setting-item-description',
    });
    cardTypeDropdownDescriptionEl.style.paddingTop = '0';
    const cardTypeDropdown = new DropdownComponent(addOptionsContainerEl)
      .addOptions({ basic: 'Basic' })
      .setDisabled(true);
    cardTypeDropdown.selectEl.style.width = '100%';

    // Renders the deck dropdown.
    const deckDropdownDescriptionEl = addOptionsContainerEl.createEl('p', {
      text: 'Deck:',
      cls: 'setting-item-description',
    });
    deckDropdownDescriptionEl.style.paddingTop = '0';
    this.deckDropdownComp = new DropdownComponent(
      addOptionsContainerEl,
    ).addOptions(decks);
    this.deckDropdownComp.selectEl.style.width = '100%';

    this.frontInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Front',
    });
    this.frontInputComp.onChange(this.handleInputChange.bind(this));

    this.backInputComp = new InputFieldComponent(this.contentEl, {
      description: 'Back',
    });
    this.backInputComp.descriptionEl.style.marginTop = 'var(--size-2-3)';
    this.backInputComp.onChange(this.handleInputChange.bind(this));

    // Renders buttons bar component.
    this.buttonsBarComp = new ButtonsBarComponent(this.contentEl)
      .setSubmitButtonDisabled(true)
      .setSubmitText('Add')
      .onSubmit(this.submit.bind(this))
      .onClose(this.close.bind(this));
    this.buttonsBarComp.buttonsBarEl.style.paddingTop = 'var(--size-4-2)';
  }

  private handleInputChange() {
    const disabled =
      this.frontInputComp.getValue().length === 0 ||
      this.backInputComp.getValue().length === 0;
    this.buttonsBarComp.setSubmitButtonDisabled(disabled);
  }

  private submit(): void {
    console.log(
      this.deckDropdownComp.getValue(),
      this.frontInputComp.getValue(),
      this.backInputComp.getValue(),
    );
  }

  onClose(): void {
    super.onClose();
    this.contentEl.empty();
  }
}
