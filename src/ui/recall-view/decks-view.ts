import { ButtonComponent } from 'obsidian';
import { RecallSubView } from './sub-view';

export class DecksView extends RecallSubView {
  private rootEl: HTMLElement;

  public render(): void {
    this.rootEl = this.recallView.rootEl.createDiv('better-recall-decks-view');

    this.renderDecks();
    this.renderButtons();
  }

  private renderDecks(): void {
    const decksCardEl = this.rootEl.createDiv('better-recall-card');

    const tableEl = decksCardEl.createEl('table', {
      cls: 'better-recall-deck-table',
    });
    const headerRow = tableEl.createEl('tr');
    headerRow.createEl('th', { text: 'Deck' });
    headerRow.createEl('th', { text: 'New' });
    headerRow.createEl('th', { text: 'Learn' });
    headerRow.createEl('th', { text: 'Due' });

    this.plugin.decksManager.decksArray.forEach((deck) => {
      const deckRowEl = tableEl.createEl('tr', { cls: 'better-recall-deck' });
      const deckDataEl = deckRowEl.createEl('td');
      deckDataEl.createEl('a', { text: deck.name });

      deckRowEl.createEl('td', { text: '1' });
      deckRowEl.createEl('td', { text: '0' });
      deckRowEl.createEl('td', { text: '0' });
    });
  }

  private renderButtons(): void {
    const buttonsBarEl = this.rootEl.createDiv('better-recall-buttons-bar');
    buttonsBarEl.style.marginTop = '1rem';

    const createDeckButton = new ButtonComponent(buttonsBarEl);
    createDeckButton.setButtonText('Create Deck');
    createDeckButton.setCta();
  }
}
