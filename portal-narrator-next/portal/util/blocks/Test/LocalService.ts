import { JSONSchema7 } from 'json-schema'
import {
  DataSubmitBody,
  FormState,
  BlockContent,
  BlockService,
  UpdateSchemaSubmitBody,
  UpdateSchemaResponse,
  ProcessDataSubmitBody,
  ProcessDataResponse,
  LoadDropdownResponse,
  IBlockOptions,
  GenericBlockOption,
} from '.././interfaces'

import { getLogger } from '@/util/logger'
const logger = getLogger()

//
// Loads local form schemas instead of remote ones. Super handy
// for testing things out while developing
//

// To use: add a json file to this folder and add a
// corresponding entry to the loadSchemas function

class LocalService implements BlockService {
  private _currentSchema: JSONSchema7 | null = null

  loadSchemasDirect = (): IBlockOptions => {
    return {
      blocks: [
        {
          slug: 'warehouse',
          title: 'Warehouse',
          version: 1,
          advanced: false,
        },
        {
          slug: 'transformation-context',
          title: 'Transformation Context',
          version: 1,
          advanced: false,
        },
        {
          slug: 'simple-dropdown',
          title: 'Basic dropdown',
          version: 0,
          advanced: false,
        },
        {
          slug: 'simple-dropdown-dependencies',
          title: 'Basic dropdown with dependencies',
          version: 0,
          advanced: false,
        },
        {
          slug: 'any-of',
          title: 'Simple any-of example',
          version: 0,
          advanced: false,
        },

        // for this example: the ui-schema we pass to the library should look like this
        // {
        //   "firstName": {
        //     "ui:widget": "textarea"
        //   }
        // }
        {
          slug: 'meta-ui',
          title: 'UI definitions',
          version: 0,
          advanced: false,
        },
        {
          slug: 'step',
          title: 'Step',
          version: 1,
          advanced: false,
        },
        {
          slug: 'query-with-scratchpad',
          title: 'Query with Scratchpad',
          version: 1,
          advanced: false,
        },
        {
          slug: 'percent-widget',
          title: 'Percent Widget',
          version: 1,
          advanced: false,
        },
        {
          slug: 'tab-testing',
          title: 'Testing Tabs',
          version: 0,
          advanced: false,
        },
        {
          slug: 'info-modal',
          title: 'Info Modal',
          version: 0,
          advanced: false,
        },
        {
          slug: 'table',
          title: 'Simple Table',
          version: 1,
          advanced: false,
        },
        {
          slug: 'metric',
          title: 'Metric Field',
          version: 1,
          advanced: false,
        },
        {
          slug: 'confetti',
          title: 'Confetti',
          version: 1,
        },
      ] as GenericBlockOption[],
    }
  }

  loadSchemas = async (): Promise<IBlockOptions> => {
    return this.loadSchemasDirect()
  }

  getForm = async (schemaSlug: string): Promise<FormState> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    const formState = require(`./${schemaSlug}.json`)
    this._currentSchema = formState.schema

    return formState
  }

  updateSchema = async (schemaSlug: string, body?: UpdateSchemaSubmitBody): Promise<UpdateSchemaResponse> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    logger.debug({ fieldSlug: body?.field_slug }, 'updating schema for field slug')

    const formData = this.getForm(schemaSlug)

    // NOTE: in the future it could return another json schema, but at this point not worth it
    return formData
  }

  loadBlock = async (body?: UpdateSchemaSubmitBody): Promise<UpdateSchemaResponse> => {
    if (!body?.block_slug) {
      throw new Error('Block slug required')
    }

    logger.debug({ blockSlug: body?.block_slug }, 'updating schema for block slug')

    const formData = require('./load_block.json')

    // NOTE: in the future it could return another json schema, but at this point not worth it
    return formData
  }

  loadItemContextById = async (transformationId: string): Promise<UpdateSchemaResponse> => {
    if (!transformationId) {
      throw new Error('Schema slug required')
    }

    if (!this._currentSchema) {
      throw new Error('current schema required')
    }

    logger.debug({ transformationId }, 'loadTransformationContextById')

    // NOTE: in the future it could return another json schema, but at this point not worth it
    return {
      schema: this._currentSchema,
      ui_schema: {},
      data: {},
      internal_cache: {},
    }
  }

  processData = async (schemaSlug: string, body: ProcessDataSubmitBody): Promise<ProcessDataResponse> => {
    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    if (!this._currentSchema) {
      throw new Error('current schema required')
    }

    logger.debug({ fieldSlug: body.field_slug, data: body.data }, 'processing data for field slug')

    // NOTE: in the future it could return another json schema, but at this point not worth it
    return {
      data: body.data,
    }
  }

  loadDropdown = async (): Promise<LoadDropdownResponse> => {
    return {
      data: {
        values: [],
      },
    }
  }

  submitForm = async (schemaSlug: string, body: DataSubmitBody): Promise<BlockContent[]> => {
    // TODO: can define and load a form response json for the given schema slug
    // For now just return the form data

    if (!schemaSlug) {
      throw new Error('Schema slug required')
    }

    return [
      {
        type: 'json',
        value: body,
      },
    ]
  }
}

export default LocalService
