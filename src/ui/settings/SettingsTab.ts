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
import { SettingConfig, SettingRenderer } from './Renderer';

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
    'Weight Parameters': {
      parameter: 'w',
      description:
        'Array of 19 weight parameters (w[0] to w[18]) that control the FSRS memory model. Comma-separated values. These are trained on your review history to optimize scheduling.',
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
    new Setting(this.containerEl)
      .setName('Scheduling Algorithm')
      .setDesc('Change the scheduling algorithm for your spaced repetition.')
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(this.schedulingAlgorithmLabels)
          .setValue(this.plugin.getSettings().schedulingAlgorithm)
          .onChange(async (value) => {
            if (this.isValidSchedulingAlgorithm(value)) {
              this.plugin.setSchedulingAlgorithm(value);
              await this.plugin.savePluginData();
              this.display();
            }
          });
      });
  }

  private renderFSRSParameters(): void {
    const renderer = new SettingRenderer(this.containerEl, () =>
      this.plugin.savePluginData(),
    );
    const params = this.plugin.getSettings().fsrsParameters;

    Object.entries(this.titleParameterMappingFSRS).forEach(
      ([name, { parameter, description }]) => {
        const config: SettingConfig<any> = {
          name,
          description,
          defaultValue: DEFAULT_SETTINGS.fsrsParameters[parameter],
        };

        if (parameter === 'w') {
          config.arrayLength = 19;
        }

        renderer.render(config, params[parameter], (value) =>
          this.plugin.setParameter(SchedulingAlgorithm.FSRS, parameter, value),
        );
      },
    );
  }

  private renderAnkiParameters(): void {
    const renderer = new SettingRenderer(this.containerEl, () =>
      this.plugin.savePluginData(),
    );
    const params = this.plugin.getSettings().ankiParameters;

    Object.entries(this.titleParameterMappingAnki).forEach(
      ([name, { parameter, description }]) => {
        renderer.render(
          {
            name,
            description,
            defaultValue: DEFAULT_SETTINGS.ankiParameters[parameter],
          },
          params[parameter],
          (value) =>
            this.plugin.setParameter(
              SchedulingAlgorithm.Anki,
              parameter,
              value,
            ),
        );
      },
    );
  }

  private isValidSchedulingAlgorithm(
    value: string,
  ): value is SchedulingAlgorithm {
    return Object.values(SchedulingAlgorithm).includes(
      value as SchedulingAlgorithm,
    );
  }
}
