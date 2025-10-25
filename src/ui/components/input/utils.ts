import { P_DESCRIPTION, SETTING_ITEM_DESCRIPTION } from 'src/ui/classes';
import { cn } from 'src/util';

export function createDescriptionEl(
  container: HTMLElement,
  inputEl: HTMLElement,
  text: string,
): HTMLElement {
  const descriptionEl = container.createEl('p', {
    text,
    cls: cn(SETTING_ITEM_DESCRIPTION, P_DESCRIPTION),
  });
  container.insertBefore(descriptionEl, inputEl);
  return descriptionEl;
}
