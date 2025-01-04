import makeFormState from './makeFormState'

import datasetFullResponse from '../../../test/fixtures/datasetFullResponse.json'

const tables = [
  {
    customer_table: 'v_customers',
    customer_label: 'People',
    activity_stream: 'mv_activity_stream',
    identifier: 'Email',
  },
]

const liveActivities = [
  {
    slug: 'survey_email_captured',
    enrichment: {
      table: 'mv_enrich_uranium',
    },
  },
]

describe('#makeFormState', () => {
  it('creates Form State from queryDefinition', () => {
    expect(makeFormState({ queryDefinition: datasetFullResponse.query_definition })).toMatchSnapshot()
  })

  it('updates the enrichment in the query definition based on the live activities', () => {
    expect(makeFormState({ queryDefinition: datasetFullResponse.query_definition, liveActivities })).toMatchSnapshot()
  })

  it('creates default form from empty queryDefinition', () => {
    expect(makeFormState({ selectedActivityStream: 'mv_activity_stream', configTables: tables })).toMatchSnapshot()
  })

  it('throws on an empty queryDefinition without a selected activity stream', () => {
    expect(() => makeFormState({ configTables: tables })).toThrowErrorMatchingSnapshot()
  })
})
