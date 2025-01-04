import { INarrative_Template } from 'graph/generated'
import type {
  BaseMapping,
  BaseNarrativeTemplateConfig,
  CreateNarrativeResponse,
  DatasetFeatureMapping,
  FeatureMappingOption,
  FeatureOptionsData,
} from 'util/narratives/interfaces'
import { createMachine, State, Typestate } from 'xstate'
export interface NarrativeFromTemplateStates extends Typestate<NarrativeFromTemplateContext> {
  states: {
    main: {
      states: {
        search: Record<string, unknown>
        activity_mapping: Record<string, unknown>
        dataset_feature_mapping: Record<string, unknown>
        word_mappings: Record<string, unknown>
        assembled: Record<string, unknown>
      }
    }
    api: {
      states: {
        idle: Record<string, unknown>
        error: Record<string, unknown>
        loading_feature_options: Record<string, unknown>
        creating_narrative: Record<string, unknown>
        assembling_narrative: Record<string, unknown>
      }
    }
  }
}

export type NarrativeFromTemplateEvent =
  | { type: 'SELECT_TEMPLATE'; graph_narrative_template: INarrative_Template }
  | { type: 'CUSTOMIZE_TEMPLATE' }
  | { type: 'CANCEL' }
  | {
      type: 'NEXT_STEP'
      activity_mapping?: BaseMapping[]
      dataset_feature_mapping?: DatasetFeatureMapping[]
    }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'NAVIGATE_STEP'; state: StepType }
  | {
      type: 'PREVIEW_NARRATIVE'
      activity_mapping?: BaseMapping[]
      dataset_feature_mapping?: DatasetFeatureMapping[]
      word_mappings?: BaseMapping[]
    }
  | {
      type: 'CREATE_NARRATIVE'
      word_mappings: BaseMapping[]
    }
  // API ACTIONS
  | { type: 'CLEAR_ERROR' }
  | { type: 'error.execution'; data: Error }
  | { type: 'error.platform.LOADING_FEATURE_OPTIONS'; data: Error }
  | { type: 'done.invoke.LOADING_FEATURE_OPTIONS'; data: FeatureOptionsData }
  | { type: 'error.platform.CREATING_NARRATIVE'; data: Error }
  | { type: 'done.invoke.CREATING_NARRATIVE'; data: any }
  | { type: 'error.platform.ASSEMBLING_NARRATIVE'; data: Error }
  | { type: 'done.invoke.ASSEMBLING_NARRATIVE'; data: any }

type StepType = 'activity_mapping' | 'dataset_feature_mapping' | 'word_mappings'

export interface NarrativeFromTemplateContext extends BaseNarrativeTemplateConfig {
  dataset_feature_mapping: DatasetFeatureMapping[]
  graph_narrative_template?: INarrative_Template
  _error: Error | null
  _feature_mapping_options?: FeatureMappingOption[]
  _completed_steps?: StepType[]
  _preview_narrative?: CreateNarrativeResponse
}

export type NarrativeFromTemplateMachineState = State<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>

import actions, { defaultTemplateConfig } from './actions'

const {
  clearError,
  handleCreateNarrativeResponse,
  persistFeatureMappingOptions,
  persistFormChanges,
  selectTemplate,
  cancel,
  setError,
} = actions

const narrativeFromTemplateMachine = createMachine<
  NarrativeFromTemplateContext,
  NarrativeFromTemplateEvent,
  NarrativeFromTemplateStates
>(
  {
    id: 'root',
    strict: true,
    type: 'parallel',
    context: {
      ...defaultTemplateConfig,
    },
    states: {
      main: {
        initial: 'search',
        states: {
          search: {
            on: {
              SELECT_TEMPLATE: {
                actions: ['selectTemplate'],
              },
              CUSTOMIZE_TEMPLATE: {
                actions: ['updateStepIndex'],
                target: ['activity_mapping'],
                cond: 'hasSelectedTemplate',
              },
            },
          },
          activity_mapping: {
            on: {
              CANCEL: {
                actions: ['cancel'],
                target: ['search'],
              },
              NEXT_STEP: [
                // Needing to select dataset features is sometimes optional:
                {
                  cond: 'skipDatasetFeatureMapping',
                  actions: ['persistFormChanges'],
                  target: ['word_mappings'],
                },
                {
                  actions: ['persistFormChanges'],
                  target: ['#root.api.loading_feature_options'],
                },
              ],
              NAVIGATE_STEP: [
                {
                  target: ['dataset_feature_mapping'],
                  cond: 'isNavigatingToDatasetFeatureMapping',
                },
                { target: ['word_mappings'], cond: 'isNavigatingToWordMappings' },
              ],
              PREVIEW_NARRATIVE: {
                actions: ['persistFormChanges'],
                target: ['#root.api.creating_narrative'],
              },
            },
          },
          dataset_feature_mapping: {
            on: {
              CANCEL: {
                actions: ['cancel'],
                target: ['search'],
              },
              PREVIOUS_STEP: {
                target: ['activity_mapping'],
              },
              NEXT_STEP: {
                actions: ['persistFormChanges'],
                target: ['word_mappings'],
              },
              NAVIGATE_STEP: [
                { target: ['activity_mapping'], cond: 'isNavigatingToActivityMapping' },
                { target: ['word_mappings'], cond: 'isNavigatingToWordMappings' },
              ],
              PREVIEW_NARRATIVE: {
                actions: ['persistFormChanges'],
                target: ['#root.api.creating_narrative'],
              },
            },
          },
          word_mappings: {
            on: {
              CANCEL: {
                actions: ['cancel'],
                target: ['search'],
              },
              PREVIOUS_STEP: {
                target: ['dataset_feature_mapping'],
              },
              NAVIGATE_STEP: [
                { target: ['activity_mapping'], cond: 'isNavigatingToActivityMapping' },
                {
                  target: ['dataset_feature_mapping'],
                  cond: 'isNavigatingToDatasetFeatureMapping',
                },
              ],
              PREVIEW_NARRATIVE: {
                actions: ['persistFormChanges'],
                target: ['#root.api.creating_narrative'],
              },
              CREATE_NARRATIVE: {
                actions: ['persistFormChanges'],
                target: ['#root.api.creating_narrative'],
              },
            },
          },
          assembled: {},
        },
      },
      api: {
        initial: 'idle',
        states: {
          idle: {},
          error: {
            on: {
              CLEAR_ERROR: {
                target: ['idle'],
                actions: ['clearError'],
              },
            },
          },
          loading_feature_options: {
            invoke: {
              id: 'LOADING_FEATURE_OPTIONS',
              src: 'doLoadFeatureOptions',
              onDone: {
                target: ['idle', '#root.main.dataset_feature_mapping'],
                actions: ['persistFeatureMappingOptions'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          creating_narrative: {
            invoke: {
              id: 'CREATING_NARRATIVE',
              src: 'doCreateNarrative',
              onDone: [
                // Preview path
                // Just show the narrative and dataset preview urls on the UI
                {
                  target: ['idle'],
                  cond: 'isPreviewing',
                  actions: ['handleCreateNarrativeResponse'],
                },
                // Create path
                // Take the resulting narrative and assemble it
                {
                  target: ['assembling_narrative'],
                  actions: ['handleCreateNarrativeResponse'],
                },
              ],
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          assembling_narrative: {
            invoke: {
              id: 'ASSEMBLING_NARRATIVE',
              src: 'doAssembleNarrative',
              onDone: {
                target: ['idle', '#root.main.assembled'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
        },
      },
    },
  },
  {
    // see machineServices for list of available services:
    services: {},

    guards: {
      skipDatasetFeatureMapping: (context) => context.dataset_feature_mapping.length === 0,
      hasSelectedTemplate: (context) => !!context.graph_narrative_template,
      isNavigatingToActivityMapping: (_, event) =>
        event.type === 'NAVIGATE_STEP' ? event.state === 'activity_mapping' : false,
      isNavigatingToDatasetFeatureMapping: (_, event) =>
        event.type === 'NAVIGATE_STEP' ? event.state === 'dataset_feature_mapping' : false,
      isNavigatingToWordMappings: (_, event) =>
        event.type === 'NAVIGATE_STEP' ? event.state === 'word_mappings' : false,
      isPreviewing: (_, event) => event.type === 'done.invoke.CREATING_NARRATIVE' && event.data.preview,
    },
    actions: {
      clearError,
      handleCreateNarrativeResponse,
      persistFeatureMappingOptions,
      persistFormChanges,
      selectTemplate,
      cancel,
      setError,
    },
  }
)

export default narrativeFromTemplateMachine
