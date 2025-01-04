import { ICompany } from 'graph/generated'
import _ from 'lodash'
import type {
  NarrativeFromTemplateContext,
  NarrativeFromTemplateEvent,
} from 'machines/narrativeTemplates/narrativeFromTemplateMachine'
import { reportError } from 'util/errors'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'
import { assembleNarrative } from 'util/narratives'
import { CreateNarrativeResponse, FeatureOption, FeatureOptionsData } from 'util/narratives/interfaces'

interface IWrapperServicesProps {
  company: ICompany
  getToken: GetToken
}

interface FetchGetFeatureValuesArgs {
  getToken: GetToken
  company: ICompany
  featureId: string
  context: NarrativeFromTemplateContext
}

const fetchGetFeatureValues = async ({
  getToken,
  company,
  featureId,
  context,
}: FetchGetFeatureValuesArgs): Promise<FeatureOption[]> => {
  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/narrative/template/get_feature_values',
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify({
      feature_id: featureId,
      activity_mapping: context.activity_mapping,
      word_mapping: context.word_mappings,
      // convert graph template to an actual JSON object:
      template: context.graph_narrative_template?.template
        ? JSON.parse(context.graph_narrative_template?.template)
        : {},
    }),
    company,
  })

  return response
}

interface FetchCreateNarrativeArgs {
  getToken: GetToken
  company: ICompany
  context: NarrativeFromTemplateContext
  preview?: boolean
}

const fetchCreateNarrative = async ({
  getToken,
  company,
  context,
  preview = false,
}: FetchCreateNarrativeArgs): Promise<CreateNarrativeResponse> => {
  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/narrative/template/create',
    params: {
      company: company.slug,
      preview,
    },
    getToken,
    body: JSON.stringify({
      activity_mapping: context.activity_mapping,
      word_mapping: context.word_mappings,
      feature_mapping: context.dataset_feature_mapping,
      // convert graph template to an actual JSON object:
      template: context.graph_narrative_template?.template
        ? JSON.parse(context.graph_narrative_template?.template)
        : {},
      // TODO - what do we want to do with narrative_name?
      // TODO - what do we want to do with narrative_name?
      // TODO - what do we want to do with narrative_name?
      // TODO - what do we want to do with narrative_name?
      // TODO - what do we want to do with narrative_name?
      narrative_name: context.graph_narrative_template?.question,
    }),
    company,
  })

  return response
}

interface DoCreateNarrativeResponse extends CreateNarrativeResponse {
  preview: boolean
}

const machineServices = ({ company, getToken }: IWrapperServicesProps) => {
  return {
    doLoadFeatureOptions: async (
      _context: NarrativeFromTemplateContext,
      event: NarrativeFromTemplateEvent
    ): Promise<FeatureOptionsData> => {
      let availableFeaturesResponse
      if (event.type === 'NEXT_STEP') {
        try {
          availableFeaturesResponse = await Promise.all(
            _.map(_context.dataset_feature_mapping, async (featureMapping) => {
              const response = await fetchGetFeatureValues({
                getToken,
                company,
                featureId: featureMapping.old_id,
                context: _context,
              })
              return {
                feature_mapping_old_id: featureMapping.old_id,
                options: response,
              }
            })
          )
        } catch (error) {
          reportError('Failed to Load Narrative Template feature options', error as Error)
          return Promise.reject(error)
        }
      }
      return {
        feature_mapping_options: availableFeaturesResponse || [],
      }
    },
    doCreateNarrative: async (
      _context: NarrativeFromTemplateContext,
      event: NarrativeFromTemplateEvent
    ): Promise<DoCreateNarrativeResponse | undefined> => {
      // This controls passing the ?preview=true flag to mavis api
      // Preview: upload the narrative to s3 without creating the Narrative
      // and child Datasets in graph
      const preview = event.type === 'PREVIEW_NARRATIVE'

      let createNarrativeResponse
      try {
        if (preview || event.type === 'CREATE_NARRATIVE') {
          createNarrativeResponse = await fetchCreateNarrative({
            getToken,
            company,
            context: _context,
            preview,
          })
        }
      } catch (error) {
        reportError('Failed to generate Narrative from template', error as Error)
        return Promise.reject(error)
      }

      return createNarrativeResponse
        ? {
            preview,
            ...createNarrativeResponse,
          }
        : undefined
    },
    doAssembleNarrative: async (
      _context: NarrativeFromTemplateContext,
      event: NarrativeFromTemplateEvent
    ): Promise<any> => {
      let assembleNarrativeResponse
      try {
        if (event.type === 'done.invoke.CREATING_NARRATIVE') {
          assembleNarrativeResponse = await assembleNarrative({
            getToken,
            company,
            narrativeSlug: event.data.narrative_slug,
          })
        }
      } catch (error) {
        reportError('Failed to assemble Narrative from template', error as Error)
        return Promise.reject(error)
      }

      return assembleNarrativeResponse
    },
  }
}

export default machineServices
