import { RecallView } from ".";
import { RecallSubView } from "./sub-view";

export class EmptyView extends RecallSubView {
  private containerEl: HTMLElement;

  constructor(public readonly recallView: RecallView) {
    super(recallView);
  }

  public render(): void {
    this.containerEl = this.recallView.rootEl.createDiv(
      "better-recall-empty-view",
    );
    this.containerEl.innerText = "Hello World!";
  }
}
