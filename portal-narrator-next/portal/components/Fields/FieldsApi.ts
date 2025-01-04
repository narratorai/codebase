import { ICompany } from 'graph/generated'
import MavisApiBase from 'util/MavisApiBase'
import { GetToken } from 'util/interfaces'

import { getLogger } from '@/util/logger'
const logger = getLogger()

//
// Loads fields data that we need
//

interface ColumnResult {
  id: string
  label: string
}
interface GroupResult {
  name: string
  slug: string
  columns: ColumnResult[]
}

class FieldsApi extends MavisApiBase {
  constructor({ getToken, company }: { getToken: GetToken; company: ICompany }) {
    super({ getToken, company })
  }

  getDatasetGroups = async (slug: string): Promise<GroupResult[]> => {
    const endpoint = `/v1/dataset/groups_autocomplete`
    logger.info({ slug }, 'Loading groups for dataset')

    try {
      return await this._callApi<GroupResult[]>({ endpoint, params: { dataset_slug: slug } })
    } catch (err) {
      throw new Error(`Error loading group autocomplete for slug ${slug}: ${(err as Error).message}`)
    }
  }
}

export default FieldsApi
