import {
  Setting,
  PluginSettingTab,
  TextComponent,
  DropdownComponent,
} from 'obsidian';
import BetterRecallPlugin from 'src/main';
import { ResetButtonComponent } from '../components/ResetButtonComponent';
import {
  AnkiParameters,
  DEFAULT_SETTINGS,
  FSRSParameters,
  SchedulingAlgorithm,
} from 'src/settings/data';
import { __setFunctionName } from 'tslib';

export class SettingsTab extends PluginSettingTab {
  private titleParameterMappingAnki: Record<
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

  private titleParameterMappingFSRS: Record<
    string,
    { description: string; parameter: keyof FSRSParameters }
  > = {
    'Request Retention': {
      parameter: 'requestRetention',
      description:
        'Target retention rate (probability of remembering a card). Trade-off between retention and workload.',
    },
    'Maximum Interval': {
      parameter: 'maximumInterval',
      description: 'Maximum interval in days between reviews.',
    },
    'Enable Fuzz': {
      parameter: 'enableFuzz',
      description:
        'Whether to add random variation to intervals to distribute reviews.',
    },
    'Enable Short Term': {
      parameter: 'enableShortTerm',
      description: 'Whether to enable short-term memory handling.',
    },
  };

  private readonly schedulingAlgorithmLabels: Record<
    SchedulingAlgorithm,
    string
  > = {
    [SchedulingAlgorithm.Anki]: 'Anki',
    [SchedulingAlgorithm.FSRS]: 'FSRS',
  };

  constructor(private plugin: BetterRecallPlugin) {
    super(plugin.app, plugin);
  }

  display() {
    this.containerEl.empty();
    this.renderSchedulingAlgorithmDropdown();

    const currentAlgorithm = this.plugin.getSettings().schedulingAlgorithm;

    if (currentAlgorithm === SchedulingAlgorithm.Anki) {
      this.renderAnkiParameters();
    } else if (currentAlgorithm === SchedulingAlgorithm.FSRS) {
      this.renderFSRSParameters();
    }
  }

  private renderSchedulingAlgorithmDropdown() {
    const setting = new Setting(this.containerEl)
      .setName('Scheduling Algorithm')
      .setDesc('Change the scheduling algorithm for your spaced repetition.');

    setting.addDropdown((dropdown) => {
      dropdown.addOptions(this.schedulingAlgorithmLabels);
      dropdown.setValue(this.plugin.getSettings().schedulingAlgorithm);
      dropdown.onChange(async (value) => {
        if (this.isValidSchedulingAlgorithm(value)) {
          this.plugin.setSchedulingAlgorithm(value);
          await this.plugin.savePluginData();
          this.display();
        }
      });
    });
  }

  private renderFSRSParameters(): void {
    Object.entries(this.titleParameterMappingFSRS).forEach(
      ([key, { parameter, description }]) => {
        const pluginValue = this.plugin.getSettings().fsrsParameters[parameter];

        if (parameter === 'enableFuzz' || parameter === 'enableShortTerm') {
          this.renderBooleanSetting(
            key,
            description,
            parameter,
            pluginValue as boolean,
          );
        } else {
          this.renderNumericSetting(
            key,
            description,
            parameter,
            pluginValue as number,
          );
        }
      },
    );

    this.renderWeightParameters();
  }

  private renderBooleanSetting(
    name: string,
    description: string,
    parameter: keyof FSRSParameters,
    value: boolean,
  ): void {
    const setting = new Setting(this.containerEl)
      .setName(name)
      .setDesc(description);

    new ResetButtonComponent(setting.controlEl).onClick(async () => {
      const defaultValue = DEFAULT_SETTINGS.fsrsParameters[parameter];
      this.plugin.setParameter(
        SchedulingAlgorithm.FSRS,
        parameter,
        defaultValue,
      );
      await this.plugin.savePluginData();
      this.display();
    });

    setting.addToggle((toggle) => {
      toggle.setValue(value);
      toggle.onChange(async (newValue) => {
        this.plugin.setParameter(SchedulingAlgorithm.FSRS, parameter, newValue);
        await this.plugin.savePluginData();
      });
    });
  }

  private renderNumericSetting(
    name: string,
    description: string,
    parameter: keyof FSRSParameters,
    value: number,
  ): void {
    let textComponent: TextComponent | null = null;
    const setting = new Setting(this.containerEl)
      .setName(name)
      .setDesc(description);

    new ResetButtonComponent(setting.controlEl).onClick(async () => {
      if (!textComponent) return;
      const defaultValue = DEFAULT_SETTINGS.fsrsParameters[parameter];
      textComponent.setValue(defaultValue.toString());
      this.plugin.setParameter(
        SchedulingAlgorithm.FSRS,
        parameter,
        defaultValue,
      );
      await this.plugin.savePluginData();
    });

    setting.addText((text) => {
      textComponent = text;
      text.setValue(value.toString());
      text.onChange(async (input) => {
        const trimmed = input.trim();
        if (!isNaN(+trimmed)) {
          this.plugin.setParameter(
            SchedulingAlgorithm.FSRS,
            parameter,
            Number(trimmed),
          );
          await this.plugin.savePluginData();
        }
      });
    });
  }

  private renderWeightParameters(): void {
    const weights = this.plugin.getSettings().fsrsParameters.w;
    let textComponent: TextComponent | null = null;

    const setting = new Setting(this.containerEl)
      .setName('Weight Parameters (w)')
      .setDesc(
        'Array of 19 weight parameters that control the FSRS memory model. Comma-separated values.',
      );

    new ResetButtonComponent(setting.controlEl).onClick(async () => {
      if (!textComponent) return;
      const defaultValue = DEFAULT_SETTINGS.fsrsParameters.w;
      textComponent.setValue(defaultValue.join(','));
      this.plugin.setParameter(SchedulingAlgorithm.FSRS, 'w', defaultValue);
      await this.plugin.savePluginData();
    });

    setting.addText((text) => {
      textComponent = text;
      text.setValue(weights.join(','));
      text.onChange(async (input) => {
        const trimmed = input.trim();
        if (this.isStringValidArray(trimmed)) {
          const newValue = this.parseStringToArray(trimmed);
          if (newValue.length === 19) {
            this.plugin.setParameter(SchedulingAlgorithm.FSRS, 'w', newValue);
            await this.plugin.savePluginData();
          }
        }
      });
    });
  }

  private renderAnkiParameters(): void {
    Object.entries(this.titleParameterMappingAnki).forEach(
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
          this.plugin.setParameter(
            SchedulingAlgorithm.Anki,
            parameter,
            defaultValue,
          );
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
              this.plugin.setParameter(
                SchedulingAlgorithm.Anki,
                parameter,
                newValue,
              );
            } else {
              if (isNaN(+input)) {
                return;
              }

              this.plugin.setParameter(
                SchedulingAlgorithm.Anki,
                parameter,
                Number(input),
              );
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

  private isValidSchedulingAlgorithm(
    value: string,
  ): value is SchedulingAlgorithm {
    return Object.values(SchedulingAlgorithm).includes(
      value as SchedulingAlgorithm,
    );
  }

  private isStringValidArray(input: string): boolean {
    return input
      .trim()
      .split(',')
      .every((text) => !isNaN(+text));
  }
}
