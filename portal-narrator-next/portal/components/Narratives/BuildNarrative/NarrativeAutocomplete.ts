import { IBasicCompletionDefinition } from '@narratorai/the-sequel'
import { ICompany } from 'graph/generated'
import { GetToken } from 'util/interfaces'
import MavisApiBase from 'util/MavisApiBase'
import { IAssembledFieldsResponse } from 'util/narratives/interfaces'

import { getLogger } from '@/util/logger'

const logger = getLogger()

class NarrativeAutocomplete extends MavisApiBase {
  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    super({ getToken, company })
  }

  loadAutocomplete = async (
    fields?: IAssembledFieldsResponse['fields']
  ): Promise<IBasicCompletionDefinition[] | undefined> => {
    const endpoint = `/v1/narrative/autcomplete`
    logger.info('Loading narrative autocomplete')

    try {
      const response = await this._callApi<IBasicCompletionDefinition>({
        endpoint,
        method: 'POST',
        body: {
          fields: fields || {},
        },
      })

      return [response]
    } catch (err) {
      throw new Error(`Error loading narrative autocomplete data: ${(err as Error).message}`)
    }
  }
}

export default NarrativeAutocomplete
