import { makeDatasetFeatureMapping } from './helpers'
import { TemplateDatasetConfig } from 'util/narratives/interfaces'

const datasets = [
  {
    mapping: { old_id: 'oldId12345' },
    feature_mapping: [{ old_id: 'featureOldId098134' }, { old_id: 'featureOldId782389' }],
  },
  {
    mapping: { old_id: 'oldId90398' },
    feature_mapping: [{ old_id: 'featureOldId098a08' }, { old_id: 'featureOldId98af93' }],
  },
] as TemplateDatasetConfig[]

describe('#makeDatasetFeatureMapping', () => {
  it('creates an object for each dataset old_id and all its feature mappings', () => {
    expect(makeDatasetFeatureMapping(datasets)).toMatchSnapshot()
  })
})
