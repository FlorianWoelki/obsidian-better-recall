import { RecallView } from ".";

export abstract class RecallSubView {
  constructor(public readonly recallView: RecallView) {}

  public abstract render(): void;
}
