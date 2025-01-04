import { ICompany } from 'graph/generated'
import _ from 'lodash'
import { GetToken } from 'util/interfaces'
import MavisApiBase from 'util/MavisApiBase'

import { getLogger } from '@/util/logger'

import {
  BlockContent,
  BlockService,
  DataSubmitBody,
  IBlockOptions,
  LoadDropdownResponse,
  ProcessDataResponse,
  ProcessDataSubmitBody,
  ResourceType,
  UpdateSchemaResponse,
  UpdateSchemaSubmitBody,
} from './interfaces'
const logger = getLogger()

//
// Service to help with non-view logic (like calling APIs)
//

class GenericBlockService extends MavisApiBase implements BlockService {
  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    super({ getToken, company })
  }

  ////////////////// Endpoints Below for all schema versions //////////////////

  loadSchemas = async ({ asAdmin = false }: { asAdmin?: boolean }): Promise<IBlockOptions | undefined> => {
    let response: any
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/block`

    try {
      response = await this._callApi({ endpoint })
    } catch (err) {
      throw new Error(`Error loading schemas: ${(err as Error).message}`)
    }

    return response
  }

  submitForm = async (schemaSlug: string, body: DataSubmitBody, asAdmin?: boolean): Promise<BlockContent[]> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    let response: BlockContent | BlockContent[]
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/block/${schemaSlug}`

    try {
      response = await this._callApi<BlockContent | BlockContent[]>({ endpoint, method: 'POST', body, autoRetry: true })
    } catch (err) {
      throw new Error(`Error running form: ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', response }, 'submitForm response')

    // IMPORTANT: this function will always return an Array,
    // regardless of v1 or v2
    return _.isArray(response) ? response : [response]
  }

  ////////////////// v1 Schema Endpoints Below //////////////////

  // Given a particular jsonschema field has ["ui:options"]."update_schema": true
  // We pass in the field_slug that contained the ["ui:options"]."update_schema"
  // Update the schema and ui_schema values only (and potentially internal_cache)!
  updateSchema = async (
    schemaSlug: string,
    body?: UpdateSchemaSubmitBody,
    asAdmin?: boolean
  ): Promise<UpdateSchemaResponse> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    // updateSchema can be used to get the initial form (which may be new and have no previous data)
    // add an empty body if instantiating a new form
    const cleanBody = _.isEmpty(body) ? {} : body
    let response: UpdateSchemaResponse
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/block/${schemaSlug}/schema`

    try {
      response = await this._callApi<UpdateSchemaResponse>({
        endpoint,
        method: 'POST',
        body: cleanBody,
        autoRetry: true,
      })
    } catch (err) {
      throw new Error(`Error running form: ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', schemaSlug, body, response }, 'updated schema')

    return response
  }

  // Used within the Narratives so we can pass in `fields` when loading blocks
  loadBlock = async (body?: UpdateSchemaSubmitBody): Promise<UpdateSchemaResponse> => {
    if (!body?.block_slug) {
      throw new Error('Block slug required')
    }

    // loadBlock can be used to get the initial form (which may be new and have no previous data)
    // add an empty body if instantiating a new form
    const cleanBody = _.isEmpty(body) ? {} : body

    let response: UpdateSchemaResponse
    const endpoint = `/v1/narrative/load_block`

    try {
      response = await this._callApi<UpdateSchemaResponse>({
        endpoint,
        method: 'POST',
        body: cleanBody,
        autoRetry: true,
      })
    } catch (err) {
      throw new Error(`Error loading block "${body.block_slug}": ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', blockSlug: body.block_slug, response }, 'loaded block')
    return response
  }

  // Given a particular jsonschema field has ["ui:options"]."process_data": true
  // We pass in the field_slug that contained the ["ui:options"]."process_data"
  // Update the data values only (and potentially internal_cache)!
  processData = async (
    schemaSlug: string,
    body: ProcessDataSubmitBody,
    asAdmin?: boolean
  ): Promise<ProcessDataResponse> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    let response: ProcessDataResponse
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/block/${schemaSlug}/process`

    try {
      response = await this._callApi<ProcessDataResponse>({ endpoint, method: 'POST', body, autoRetry: true })
    } catch (err) {
      throw new Error(`Error running form: ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', fieldSlug: body.field_slug, body, response }, 'processed data')

    return response
  }

  // api call takes same data as processData but returns the value for a single dropdown
  loadDropdown = async (
    schemaSlug: string,
    body: ProcessDataSubmitBody,
    asAdmin?: boolean
  ): Promise<LoadDropdownResponse> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    let response: any
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/block/${schemaSlug}/values`

    try {
      response = await this._callApi<LoadDropdownResponse>({ endpoint, method: 'POST', body, autoRetry: true })
    } catch (err) {
      throw new Error(`Error loading dropdown values: ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', fieldSlug: body.field_slug, body, response }, 'loaded dropdown')

    return response
  }

  ////////////////// block slug specific Endpoints Below //////////////////

  // for "transformation_context" and "activity_context" blocks load a specific item by id
  // returns the equivalent of updateSchema
  loadItemContextById = async (
    id: string,
    resourceType: ResourceType,
    asAdmin?: boolean
  ): Promise<UpdateSchemaResponse> => {
    if (!id) {
      throw new Error(`${resourceType} Id required`)
    }

    let response: UpdateSchemaResponse
    // /v1/transformation/:uuid
    const endpoint = `${asAdmin ? '/admin' : ''}/v1/${resourceType}/${id}`

    try {
      response = await this._callApi<UpdateSchemaResponse>({ endpoint, method: 'GET' })
    } catch (err) {
      throw new Error(`Error loading transformation block: ${(err as Error).message}`)
    }

    logger.debug({ component: 'blocks', resourceType, resourceId: id, response }, 'loaded item context by id')

    return response
  }
}

export default GenericBlockService
