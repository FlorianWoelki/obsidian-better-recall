export function createDescriptionEl(
  container: HTMLElement,
  inputEl: HTMLElement,
  text: string,
): HTMLElement {
  const descriptionEl = container.createEl('p', {
    text,
    cls: 'setting-item-description better-recall-description',
  });
  container.insertBefore(descriptionEl, inputEl);
  return descriptionEl;
}
