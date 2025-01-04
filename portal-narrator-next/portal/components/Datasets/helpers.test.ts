import { makeDatasetTabMap } from 'components/Datasets/helpers'
import datasetsV3 from '../../../test/fixtures/datasetsV3.json'
import { IUser } from 'graph/generated'
import { DatasetsFromQuery } from 'components/Datasets/interfaces'

const user = { id: 'e3718fda-4937-494f-98b4-c7b3a910e34f' } as IUser
const datasets = datasetsV3 as DatasetsFromQuery

describe('Dataset V3 - helpers', () => {
  describe('makeDatasetTabMap', () => {
    it('matches the snapshot for regular user', () => {
      const datasetMapping = makeDatasetTabMap({ datasets, user, isSuperAdmin: false })
      expect(datasetMapping).toMatchSnapshot()
    })
    it('matches the snapshot for super admin', () => {
      const datasetMapping = makeDatasetTabMap({ datasets, user, isSuperAdmin: true })
      expect(datasetMapping).toMatchSnapshot()
    })
  })
})
