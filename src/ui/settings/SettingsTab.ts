import { Setting, PluginSettingTab, TextComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ResetButtonComponent } from '../components/ResetButtonComponent';
import { AnkiParameters, DEFAULT_SETTINGS } from 'src/settings/data';

export class SettingsTab extends PluginSettingTab {
  private titleParameterMapping: Record<string, keyof AnkiParameters> = {
    'Lapse Interval': 'lapseInterval',
    'Easy Interval': 'easyInterval',
    'Easy Bonus': 'easyBonus',
    'Graduating Interval': 'graduatingInterval',
    'Min Ease Factor': 'minEaseFactor',
    'Ease Factor Decrement': 'easeFactorDecrement',
    'Ease Factor Increment': 'easeFactorIncrement',
    'Hard Interval Multiplier': 'hardIntervalMultiplier',
    'Learning Steps': 'learningSteps',
    'Relearning Steps': 'relearningSteps',
  };

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app, plugin);
  }

  display() {
    this.containerEl.empty();

    new Setting(this.containerEl).setName('Anki Settings').setHeading();

    Object.entries(this.titleParameterMapping).forEach(([key, parameter]) => {
      let textComponent: TextComponent | null = null;
      const pluginValue = this.plugin.getSettings().ankiParameters[parameter];

      const setting = new Setting(this.containerEl).setName(key);

      new ResetButtonComponent(setting.controlEl).onClick(async () => {
        if (!textComponent) {
          return;
        }

        const defaultValue = DEFAULT_SETTINGS.ankiParameters[parameter];
        this.setValue(textComponent, defaultValue);
        this.plugin.setAnkiParameter(parameter, defaultValue);
        await this.plugin.savePluginData();
      });

      setting.addText((text) => {
        textComponent = text;
        this.setValue(text, pluginValue);

        text.onChange(async (input) => {
          input = input.trim();
          if (
            parameter === 'learningSteps' ||
            parameter === 'relearningSteps'
          ) {
            if (!this.isStringValidArray(input)) {
              console.log('not a valid array', input);
              return;
            }

            const newValue = this.parseStringToArray(input);
            this.plugin.setAnkiParameter(parameter, newValue);
          } else {
            if (isNaN(+input)) {
              return;
            }

            this.plugin.setAnkiParameter(parameter, Number(input));
          }

          await this.plugin.savePluginData();
        });
      });
    });
  }

  private setValue(text: TextComponent, value: number | number[]): void {
    if (Array.isArray(value)) {
      text.setValue(value.join(','));
    } else {
      text.setValue(value.toString());
    }
  }

  private parseStringToArray(input: string): number[] {
    return input
      .trim()
      .split(',')
      .map((text) => Number(text));
  }

  private isStringValidArray(input: string): boolean {
    return input
      .trim()
      .split(',')
      .every((text) => !isNaN(+text));
  }
}
