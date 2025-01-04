import { createElasticSearchQuery, makeHighlightObjects, getShownColumnsAndValues } from './'

describe('#mapFieldsToHighlight', () => {
  it('creates the query object for a set of terms strips the score boosting modifier from the field name (i.e. ^2) for highlight', () => {
    const fields = [
      'name^3',
      'description',
      'feature_and_enrichment_attributes.label^2',
      'feature_and_enrichment_attributes.values.value',
    ]
    expect(
      createElasticSearchQuery({
        searchText: 'find me',
        fields,
        fragmentSize: 26,
        fieldValueFactor: {
          field: 'level',
          factor: 3,
          modifier: 'log',
          missing: 1,
        },
      })
    ).toMatchSnapshot()
  })
})

describe('#makeHighlightObjects', () => {
  it('creates an object that contains the highlighted text and the original text minus the markup', () => {
    const highlight = {
      'activities.name': [
        'View Cohort <span class="highlighted">Analyses</span>',
        'View Segment <span class="highlighted">Aggs</span>',
        'View <span class="highlighted">Actvities</span>',
        'View <span class="highlighted">Accounts</span>',
        'View <span class="highlighted">Admin</span>',
      ],
    }
    expect(makeHighlightObjects({ highlight, getter: 'activities.name' })).toMatchSnapshot()
  })
})

describe('#getShownColumnsAndValues', () => {
  it('creates proper highlights for column values', () => {
    const highlight = {
      'columns.values.value': ['<span class="highlighted">mv_activity_stream</span>'],
    }
    const columns = [
      {
        name: 'stream_table',
        friendly_name: 'stream_table',
        values: [
          { value: 'account_stream', total_rows: 1, percent_of_total: 0.11 },
          { value: 'mv_activity_stream', total_rows: 3, percent_of_total: 0.33 },
          { value: 'people_stream', total_rows: 1, percent_of_total: 0.11 },
        ],
      },
    ]
    expect(getShownColumnsAndValues({ columns, highlight })).toMatchSnapshot()
  })

  it('creates proper highlights for column names', () => {
    const highlight = {
      'columns.name': ['<span class="highlighted">description</span>'],
    }
    const columns = [
      {
        name: 'description',
        friendly_name: 'description',
        values: [
          { value: 'one description', total_rows: 1, percent_of_total: 0.11 },
          { value: 'two description', total_rows: 3, percent_of_total: 0.33 },
        ],
      },
    ]
    expect(getShownColumnsAndValues({ columns, highlight })).toMatchSnapshot()
  })
})
