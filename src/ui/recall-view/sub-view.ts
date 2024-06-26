import BetterRecallPlugin from 'src/main';
import { RecallView } from '.';

export abstract class RecallSubView {
  constructor(
    protected readonly plugin: BetterRecallPlugin,
    protected readonly recallView: RecallView,
  ) {}

  public abstract render(): void;
}
