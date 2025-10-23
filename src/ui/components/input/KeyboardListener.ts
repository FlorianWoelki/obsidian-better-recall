export class KeyboardListener {
  constructor(
    private readonly inputEl: HTMLInputElement | HTMLTextAreaElement,
  ) {}

  public onEnter(): void {}

  public cleanup(): void {
    this.removeKeyEnterAction();
  }

  public addKeyEnterAction(): void {
    this.inputEl.addEventListener('keypress', this.onEnterPress.bind(this));
  }

  public removeKeyEnterAction(): void {
    this.inputEl.removeEventListener('keypress', this.onEnterPress.bind(this));
  }

  private onEnterPress(event: KeyboardEvent): void {
    setTimeout(() => {
      const isEmpty = this.inputEl.value.length === 0;

      if (!event.altKey || event.key !== 'Enter' || isEmpty) {
        return;
      }

      this.onEnter();
    }, 1);
  }
}
