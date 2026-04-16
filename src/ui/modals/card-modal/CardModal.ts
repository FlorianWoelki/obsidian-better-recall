import { DropdownComponent, Modal } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import {
  CARD_MODAL_DESCRIPTION,
  SETTING_ITEM_DESCRIPTION,
} from 'src/ui/classes';
import { ButtonsBarComponent } from 'src/ui/components/ButtonsBarComponent';
import { InputAreaComponent } from 'src/ui/components/input/InputAreaComponent';
import { cn } from 'src/util';

export abstract class CardModal extends Modal {
  declare private optionsContainerEl: HTMLElement;

  protected deckDropdownComp?: DropdownComponent;
  protected buttonsBarComp?: ButtonsBarComponent;

  protected inputFields?: {
    front: InputAreaComponent;
    back: InputAreaComponent;
  };

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
    this.inputFields?.front.keyboardListener.cleanup();
    this.inputFields?.back.keyboardListener.cleanup();
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
      cls: cn(SETTING_ITEM_DESCRIPTION, CARD_MODAL_DESCRIPTION),
    });
    this.deckDropdownComp = new DropdownComponent(
      this.optionsContainerEl,
    ).addOptions(decks);
    this.deckDropdownComp.selectEl.addClass('better-recall-field');
  }

  protected renderCardTypeDropdown(): void {
    this.optionsContainerEl.createEl('p', {
      text: 'Type:',
      cls: cn(SETTING_ITEM_DESCRIPTION, CARD_MODAL_DESCRIPTION),
    });
    const cardTypeDropdown = new DropdownComponent(this.optionsContainerEl)
      .addOptions({ basic: 'Basic' })
      .setDisabled(true);
    cardTypeDropdown.selectEl.addClass('better-recall-field');
  }

  protected renderBasicTypeFields(front?: string, back?: string): void {
    const frontComp = new InputAreaComponent(this.contentEl, {
      description: 'Front',
    })
      .setValue(front ?? '')
      .onChange(this.handleInputChange.bind(this));
    frontComp.keyboardListener.onEnter = () => {
      if (this.disabled) {
        return;
      }

      this.submit();
    };

    const backComp = new InputAreaComponent(this.contentEl, {
      description: 'Back',
    })
      .setValue(back ?? '')
      .onChange(this.handleInputChange.bind(this));
    backComp.descriptionEl?.addClass('better-recall-back-field');
    backComp.keyboardListener.onEnter = () => {
      if (this.disabled) {
        return;
      }

      this.submit();
    };

    this.inputFields = {
      front: frontComp,
      back: backComp,
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
    if (!this.inputFields) {
      return;
    }

    const disabled =
      this.inputFields.front.getValue().length === 0 ||
      this.inputFields.back.getValue().length === 0;
    this.buttonsBarComp?.setSubmitButtonDisabled(disabled);
  }

  protected get disabled(): boolean {
    if (!this.inputFields) {
      return true;
    }

    return (
      this.inputFields.front.getValue().length === 0 ||
      this.inputFields.back.getValue().length === 0
    );
  }
}
