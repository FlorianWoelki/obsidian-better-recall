import { Setting, PluginSettingTab } from 'obsidian';
import BetterRecallPlugin from 'src/main';
import {
  AnkiParameters,
  DEFAULT_SETTINGS,
  FSRSParameters,
  SchedulingAlgorithm,
} from 'src/settings/data';
import { SettingConfig, SettingRenderer } from './Renderer';

export class SettingsTab extends PluginSettingTab {
  private titleParameterMappingAnki: Record<
    string,
    { description: string; parameter: keyof AnkiParameters }
  > = {
    'Lapse interval': {
      parameter: 'lapseInterval',
      description:
        'How much to shrink the wait time when you forget a card (e.g., 0.5 cuts it in half).',
    },
    'Easy interval': {
      parameter: 'easyInterval',
      description:
        'How many days until you see a new card again if you mark it "easy" while learning.',
    },
    'Easy bonus': {
      parameter: 'easyBonus',
      description:
        'Extra time multiplier when you mark a review card "easy" (e.g., 1.3 adds 30% more time).',
    },
    'Graduating interval': {
      parameter: 'graduatingInterval',
      description:
        'The first review interval (in days) when a new card finishes its learning phase.',
    },
    'Min ease factor': {
      parameter: 'minEaseFactor',
      description:
        'The lowest difficulty multiplier a card can have (prevents cards from getting stuck too short).',
    },
    'Ease factor decrement': {
      parameter: 'easeFactorDecrement',
      description:
        'How much to reduce a card\'s difficulty multiplier when you mark it "again".',
    },
    'Ease factor increment': {
      parameter: 'easeFactorIncrement',
      description:
        'Amount to adjust the difficulty multiplier. Increased when marked "easy", decreased when marked "hard". Typically 0.15.',
    },
    'Hard interval multiplier': {
      parameter: 'hardIntervalMultiplier',
      description:
        'Multiplier for the next interval when you mark a card "hard" (e.g., 1.2 = 120% of current interval, a 20% increase). Always increases by at least 1 day.',
    },
    'Learning steps': {
      parameter: 'learningSteps',
      description:
        'Wait times (in minutes) for reviewing new cards. E.g., "1,10" means review after 1 minute, then 10 minutes.',
    },
    'Relearning steps': {
      parameter: 'relearningSteps',
      description:
        'Wait times (in minutes) for reviewing forgotten cards. E.g., "10" means review once after 10 minutes.',
    },
  };

  private titleParameterMappingFSRS: Record<
    string,
    { description: string; parameter: keyof FSRSParameters }
  > = {
    'Learning steps': {
      parameter: 'learningSteps',
      description:
        'Delays for new cards before they enter long‑term review (e.g. ["1m","10m"]). Shorter or more steps = more initial drilling on the first day.',
    },
    'Relearning steps': {
      parameter: 'relearningSteps',
      description:
        'Delays for cards you forgot after they were in review (e.g. ["10m"]). Controls how aggressively lapsed cards are re‑drilled before returning to normal scheduling.',
    },
    'Request retention': {
      parameter: 'requestRetention',
      description:
        'Your target success rate (e.g., 0.9 = aim to remember 90% of cards). Higher = more reviews but better retention.',
    },
    'Maximum interval': {
      parameter: 'maximumInterval',
      description:
        "The longest you'll wait between reviews (in days), no matter how well you know a card.",
    },
    'Enable fuzz': {
      parameter: 'enableFuzz',
      description:
        'Adds slight randomness to review intervals to prevent cards from bunching up on the same days.',
    },
    'Enable short term': {
      parameter: 'enableShortTerm',
      description:
        'Enables short-term memory scheduling for cards in the learning phase (more frequent initial reviews).',
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
      .setDesc(
        'Change the scheduling algorithm for your spaced repetition (WARNING: this resets the reviewing progress on all decks).',
      )
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
