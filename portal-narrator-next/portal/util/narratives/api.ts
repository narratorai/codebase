import {
  AssembleFieldsConfig,
  DuplicateNarrativeInput,
  GetFileAPIReturn,
  TContentObject,
  UpdateNarrativeMetaInput,
  UpdateNarrativeResponse,
} from 'components/Narratives/interfaces'
import { ICompany } from 'graph/generated'
import { GetToken, INarrative } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'
import { IAssembledFieldsResponse, IDependencyGraphResponse, NarrativeFields } from 'util/narratives/interfaces'

import { FieldConfig } from '../blocks/interfaces'

interface ITokenAndCompany {
  getToken: GetToken
  company: ICompany
}

interface ILoadConfigFile extends ITokenAndCompany {
  narrativeSlug: string
}

export const loadConfigFile = async ({
  company,
  narrativeSlug,
  getToken,
}: ILoadConfigFile): Promise<GetFileAPIReturn | null> => {
  const response = await mavisRequest({
    path: '/v1/narrative/get_config',
    params: {
      company: company.slug,
      slug: narrativeSlug,
    },
    getToken,
    company,
  })

  return response
}

interface IUpdateConfigFile extends ITokenAndCompany {
  narrativeSlug: string
  config: GetFileAPIReturn
}

export const updateConfigFile = async ({
  getToken,
  company,
  narrativeSlug,
  config,
}: IUpdateConfigFile): Promise<Record<string, unknown>> => {
  const response = await mavisRequest({
    method: 'PUT',
    path: `/v1/narrative/update_config/${narrativeSlug}`,
    params: {
      company: company.slug,
    },
    body: JSON.stringify(config),
    getToken,
    company,
  })

  return response
}

interface IRefreshNarrative extends ITokenAndCompany {
  config: GetFileAPIReturn
}

export const refreshNarrative = async ({
  getToken,
  company,
  config,
}: IRefreshNarrative): Promise<Record<string, unknown>> => {
  const response = await mavisRequest({
    method: 'POST',
    path: '/v1/narrative/refresh_data',
    retryable: true,
    params: {
      company: company.slug,
    },
    body: JSON.stringify(config),
    getToken,
    company,
  })

  return response
}

interface IAssembleNarrativeFields extends ITokenAndCompany {
  config: AssembleFieldsConfig
  remove?: boolean
}

export const assembleNarrativeFields = async ({
  getToken,
  company,
  config,
  remove = false,
}: IAssembleNarrativeFields): Promise<IAssembledFieldsResponse> => {
  const { field_configs, field_configs_changed, fields, dynamic_filters } = config || {}

  const response = await mavisRequest<IAssembledFieldsResponse>({
    method: remove ? 'DELETE' : 'POST',
    path: '/v1/narrative/fields/compile',
    params: {
      company: company.slug,
    },
    body: JSON.stringify({
      field_configs,
      field_configs_changed,
      fields,
      dynamic_filters,
    }),
    retryable: true,
    getToken,
    company,
  })

  return response
}

export interface IFeildsDependencyGraph extends ITokenAndCompany {
  config: {
    fieldConfigs?: FieldConfig[]
    fields?: NarrativeFields
  }
}

export const assembleNarrativeDependencyGraph = async ({
  getToken,
  company,
  config,
}: IFeildsDependencyGraph): Promise<IDependencyGraphResponse> => {
  const { fieldConfigs, fields } = config || {}

  const response = await mavisRequest<IDependencyGraphResponse>({
    method: 'POST',
    path: '/v1/narrative/fields/dependency_graph',
    params: {
      company: company.slug,
    },
    body: JSON.stringify({
      field_configs: fieldConfigs,
      fields,
    }),
    retryable: true,
    getToken,
    company,
  })

  return response
}

interface IAssembleNarrative extends ITokenAndCompany {
  narrativeSlug: string
}

export const assembleNarrative = async ({
  getToken,
  company,
  narrativeSlug,
}: IAssembleNarrative): Promise<INarrative> => {
  const response = await mavisRequest<INarrative>({
    path: `/v1/narrative/run/${narrativeSlug}`,
    params: {
      company: company.slug,
    },
    retryable: true,
    getToken,
    company,
  })

  return response
}

interface ICompileContent extends ITokenAndCompany {
  contents?: TContentObject[]
  fields?: TContentObject
}

export const compileContent = async ({
  getToken,
  company,
  contents,
  fields,
}: ICompileContent): Promise<{ compiled_content: TContentObject[] }> => {
  const response = await mavisRequest<{ compiled_content: TContentObject[] }>({
    method: 'POST',
    path: '/v1/narrative/content/compile',
    params: {
      company: company.slug,
    },
    body: JSON.stringify({
      contents,
      fields,
    }),
    retryable: true,
    getToken,
    company,
  })

  return response
}

interface ICompileBlock extends ITokenAndCompany {
  content?: TContentObject
  fields?: TContentObject
}

export const compileBlock = async ({
  getToken,
  company,
  content,
  fields,
}: ICompileBlock): Promise<{ compiled_content: TContentObject[] }> => {
  const response = await mavisRequest<{ compiled_content: TContentObject[] }>({
    method: 'POST',
    path: '/v1/narrative/content/compile',
    params: {
      company: company.slug,
    },
    body: JSON.stringify({
      content,
      fields,
    }),
    retryable: true,
    getToken,
    company,
  })

  return response
}

interface IUpdateNarrativeMeta extends UpdateNarrativeMetaInput {
  getToken: GetToken
  company: ICompany
}

export const updateNarrativeMeta = async ({
  getToken,
  company,
  narrative_id,
  name,
  description,
  category,
  schedule,
  state,
  requested_by,
  slug,
  depends_on,
  type,
  created_by,
  tags,
  config,
}: IUpdateNarrativeMeta): Promise<UpdateNarrativeResponse> => {
  const body = {
    narrative_id,
    name,
    description,
    category,
    schedule,
    state,
    requested_by,
    slug,
    depends_on,
    type,
    created_by,
    tags,
    config,
  }

  const response = await mavisRequest<UpdateNarrativeResponse>({
    method: 'POST',
    path: '/v1/narrative/update',
    params: {
      company: company.slug,
    },
    body: JSON.stringify(body),
    getToken,
    company,
  })

  return response
}

interface IDuplicateNarrative extends DuplicateNarrativeInput {
  getToken: GetToken
  company: ICompany
}

export const duplicateNarrative = async ({
  getToken,
  company,
  id,
  name,
  duplicate_datasets,
}: IDuplicateNarrative): Promise<UpdateNarrativeResponse> => {
  const response = await mavisRequest<UpdateNarrativeResponse>({
    method: 'POST',
    path: '/v1/narrative/duplicate',
    params: {
      company: company.slug,
      narrative_id: id,
    },
    body: JSON.stringify({ name, duplicate_datasets: !!duplicate_datasets }),
    getToken,
    company,
  })

  return response
}
