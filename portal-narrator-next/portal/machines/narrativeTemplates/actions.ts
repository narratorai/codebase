import type {
  NarrativeFromTemplateContext,
  NarrativeFromTemplateEvent,
} from 'machines/narrativeTemplates/narrativeFromTemplateMachine'
import { INarrativeTemplateConfig } from 'util/narratives/interfaces'
import { assign } from 'xstate'

import { makeDatasetFeatureMapping } from './helpers'

export const defaultTemplateConfig = {
  activity_mapping: [],
  datasets: [],
  dataset_feature_mapping: [],
  word_mappings: [],
  graph_narrative_template: undefined,
  _step_index: 0,
  _error: null,
  _feature_mapping_options: undefined,
}

// narrative_template.template is the stringified narrative template JSON
// see INarrativeTemplateConfig interface for structure
const makeTemplateConfigObject = (templateJsonString?: string): INarrativeTemplateConfig | undefined => {
  try {
    if (templateJsonString) {
      return JSON.parse(templateJsonString) as INarrativeTemplateConfig
    }
  } catch (error) {
    return undefined
  }
}

const actions = {
  selectTemplate: assign((context: NarrativeFromTemplateContext, event: NarrativeFromTemplateEvent) => {
    if (event.type === 'SELECT_TEMPLATE') {
      const templateConfig = makeTemplateConfigObject(event.graph_narrative_template?.template)

      return {
        ...context,
        activity_mapping: templateConfig?.activity_mapping,
        datasets: templateConfig?.datasets,
        dataset_feature_mapping: templateConfig?.datasets ? makeDatasetFeatureMapping(templateConfig?.datasets) : [],
        word_mappings: templateConfig?.word_mappings,
        additional_context: templateConfig?.additional_context,
        graph_narrative_template: event.graph_narrative_template,
      }
    }

    return context
  }),
  cancel: assign((context: NarrativeFromTemplateContext, event: NarrativeFromTemplateEvent) => {
    if (event.type === 'CANCEL') {
      return defaultTemplateConfig
    }

    return context
  }),

  // Take user entered values from final-form and put it into machine context:
  persistFormChanges: assign<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>({
    _completed_steps: (context, event) => {
      if (event.type === 'NEXT_STEP' && event.activity_mapping) {
        return ['activity_mapping']
      }

      if (event.type === 'NEXT_STEP' && event.dataset_feature_mapping) {
        return ['activity_mapping', 'dataset_feature_mapping']
      }

      return context._completed_steps
    },
    activity_mapping: (context, event) => {
      if ((event.type === 'NEXT_STEP' || event.type === 'PREVIEW_NARRATIVE') && event.activity_mapping) {
        return event.activity_mapping
      }
      return context.activity_mapping
    },
    dataset_feature_mapping: (context, event) => {
      if ((event.type === 'NEXT_STEP' || event.type === 'PREVIEW_NARRATIVE') && event.dataset_feature_mapping) {
        return event.dataset_feature_mapping
      }
      return context.dataset_feature_mapping
    },
    word_mappings: (context, event) => {
      if ((event.type === 'PREVIEW_NARRATIVE' || event.type === 'CREATE_NARRATIVE') && event.word_mappings) {
        return event.word_mappings
      }
      return context.word_mappings
    },
  }),

  // Handle API response for LOADING_FEATURE_OPTIONS
  persistFeatureMappingOptions: assign<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>({
    _feature_mapping_options: (context, event) => {
      if (event.type === 'done.invoke.LOADING_FEATURE_OPTIONS') {
        return event.data.feature_mapping_options
      }
      return context._feature_mapping_options
    },
  }),

  // Handle API response for CREATING_NARRATIVE
  handleCreateNarrativeResponse: assign<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>({
    _preview_narrative: (context, event) => {
      if (event.type === 'done.invoke.CREATING_NARRATIVE' && event.data) {
        return event.data
      }

      return context._preview_narrative
    },
  }),

  // clear out the top level _error
  // this can be triggered from anywhere
  clearError: assign<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>({
    _error: null,
  }),
  setError: assign<NarrativeFromTemplateContext, NarrativeFromTemplateEvent>({
    _error: (context, event) => {
      // Parent machine error type would be "error.execution"
      // whereas child machine error types are "error.platform.*"
      if (
        event.type === 'error.execution' ||
        event.type === 'error.platform.LOADING_FEATURE_OPTIONS' ||
        event.type === 'error.platform.CREATING_NARRATIVE' ||
        event.type === 'error.platform.ASSEMBLING_NARRATIVE'
      ) {
        return event.data
      } else {
        return context._error
      }
    },
  }),
}

export default actions
