import { Setting, TextComponent } from 'obsidian';
import { ResetButtonComponent } from '../components/ResetButtonComponent';

type SettingValue = boolean | number | string | number[];

export interface SettingConfig<T extends SettingValue = SettingValue> {
  name: string;
  description: string;
  defaultValue: T;
  validate?: (value: T) => boolean;
  arrayLength?: number;
}

type RenderFunction<T extends SettingValue> = (
  config: SettingConfig<T>,
  currentValue: T,
  onUpdate: (value: T) => void,
) => void;

export class SettingRenderer {
  private renderers: Map<string, RenderFunction<any>>;

  constructor(
    private containerEl: HTMLElement,
    private onSave: () => Promise<void>,
  ) {
    this.renderers = new Map([
      ['boolean', this.renderBoolean.bind(this)],
      ['number', this.renderNumber.bind(this)],
      ['string', this.renderText.bind(this)],
      ['array', this.renderArray.bind(this)],
    ]);
  }

  render<T extends SettingValue>(
    config: SettingConfig<T>,
    currentValue: T,
    onUpdate: (value: T) => void,
  ): void {
    const type = Array.isArray(currentValue) ? 'array' : typeof currentValue;
    const renderer = this.renderers.get(type);
    renderer?.(config, currentValue, onUpdate);
  }

  private renderBoolean(
    config: SettingConfig<boolean>,
    currentValue: boolean,
    onUpdate: (value: boolean) => void,
  ) {
    const setting = new Setting(this.containerEl)
      .setName(config.name)
      .setDesc(config.description);

    this.addResetButton(setting, config.defaultValue, onUpdate);

    setting.addToggle((toggle) => {
      toggle.setValue(currentValue).onChange(async (value) => {
        if (!config.validate || config.validate(value)) {
          onUpdate(value);
          await this.onSave();
        }
      });
    });
  }

  private renderNumber(
    config: SettingConfig<number>,
    currentValue: number,
    onUpdate: (value: number) => void,
  ) {
    let textComponent: TextComponent | null = null;
    const setting = new Setting(this.containerEl)
      .setName(config.name)
      .setDesc(config.description);

    this.addResetButton(setting, config.defaultValue, onUpdate, (val) => {
      textComponent?.setValue(val.toString());
    });

    setting.addText((text) => {
      textComponent = text;
      text.setValue(currentValue.toString()).onChange(async (input) => {
        const num = Number(input.trim());
        if (!isNaN(num) && (!config.validate || config.validate(num))) {
          onUpdate(num);
          await this.onSave();
        }
      });
    });
  }

  private renderText(
    config: SettingConfig<string>,
    currentValue: string,
    onUpdate: (value: string) => void,
  ) {
    let textComponent: TextComponent | null = null;
    const setting = new Setting(this.containerEl)
      .setName(config.name)
      .setDesc(config.description);

    this.addResetButton(setting, config.defaultValue, onUpdate, (val) => {
      textComponent?.setValue(val);
    });

    setting.addText((text) => {
      textComponent = text;
      text.setValue(currentValue).onChange(async (input) => {
        const trimmed = input.trim();
        if (!config.validate || config.validate(trimmed)) {
          onUpdate(trimmed);
          await this.onSave();
        }
      });
    });
  }

  private renderArray(
    config: SettingConfig<number[]>,
    currentValue: number[],
    onUpdate: (value: number[]) => void,
  ) {
    let textComponent: TextComponent | null = null;
    const setting = new Setting(this.containerEl)
      .setName(config.name)
      .setDesc(config.description);

    this.addResetButton(setting, config.defaultValue, onUpdate, (val) => {
      textComponent?.setValue(val.join(','));
    });

    setting.addText((text) => {
      textComponent = text;
      text.setValue(currentValue.join(',')).onChange(async (input) => {
        const parts = input.split(',').map((s) => Number(s.trim()));
        const isValid = parts.every((n) => !isNaN(n));

        if (
          isValid &&
          (!config.arrayLength || parts.length === config.arrayLength)
        ) {
          if (!config.validate || config.validate(parts)) {
            onUpdate(parts);
            await this.onSave();
          }
        }
      });
    });
  }

  private addResetButton<T>(
    setting: Setting,
    defaultValue: T,
    onUpdate: (value: T) => void,
    onReset?: (value: T) => void,
  ): void {
    new ResetButtonComponent(setting.controlEl).onClick(async () => {
      onReset?.(defaultValue);
      onUpdate(defaultValue);
      await this.onSave();
    });
  }
}
