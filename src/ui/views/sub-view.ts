import BetterRecallPlugin from 'src/main';
import { RecallView } from '.';
import { CreateDeckModal } from '../modals/create-deck-modal';

export abstract class RecallSubView {
  constructor(
    protected readonly plugin: BetterRecallPlugin,
    protected readonly recallView: RecallView,
  ) {}

  public abstract render(): void;

  public onClose() {}

  protected openDeckModal(): void {
    const modal = new CreateDeckModal(this.plugin);
    modal.open();
  }
}
