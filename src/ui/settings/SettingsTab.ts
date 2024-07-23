import { Setting, PluginSettingTab, TextComponent } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ResetButtonComponent } from '../components/ResetButtonComponent';
import { AnkiParameters, DEFAULT_SETTINGS } from 'src/settings/data';

export class SettingsTab extends PluginSettingTab {
  private titleParameterMapping: Record<
    string,
    { description: string; parameter: keyof AnkiParameters }
  > = {
    'Lapse interval': {
      parameter: 'lapseInterval',
      description:
        'The multiplier applied to the current interval when a card lapses.',
    },
    'Easy interval': {
      parameter: 'easyInterval',
      description:
        'The interval (in days) assigned to a card when rated as `easy` during learning/relearning.',
    },
    'Easy bonus': {
      parameter: 'easyBonus',
      description:
        'The multiplier applied to the interval when a review card is rated as `easy`.',
    },
    'Graduating interval': {
      parameter: 'graduatingInterval',
      description:
        'The interval (in days) assigned to a card when it graduates from learning to review.',
    },
    'Min ease factor': {
      parameter: 'minEaseFactor',
      description: 'The minimum allowed ease factor for a card.',
    },
    'Ease factor decrement': {
      parameter: 'easeFactorDecrement',
      description:
        'The amount by which the ease factor is decreased when a card is rated as `again`.',
    },
    'Ease factor increment': {
      parameter: 'easeFactorIncrement',
      description:
        'The amount by which the ease factor is increased when a card is rated as `easy`.',
    },
    'Hard interval multiplier': {
      parameter: 'hardIntervalMultiplier',
      description:
        'The multiplier applied to the current interval when a review card is rated as `hard`.',
    },
    'Learning steps': {
      parameter: 'learningSteps',
      description:
        'Comma-separated step intervals (in minutes) for new cards in the learning phase.',
    },
    'Relearning steps': {
      parameter: 'relearningSteps',
      description:
        'Comma-separated step intervals (in minutes) for cards in the relearning phase.',
    },
  };

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app, plugin);
  }

  display() {
    this.containerEl.empty();

    Object.entries(this.titleParameterMapping).forEach(
      ([key, { parameter, description }]) => {
        let textComponent: TextComponent | null = null;
        const pluginValue = this.plugin.getSettings().ankiParameters[parameter];

        const setting = new Setting(this.containerEl)
          .setName(key)
          .setDesc(description);

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
      },
    );
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
