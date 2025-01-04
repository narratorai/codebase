import { makeColumnConfigs, makeColumnHeaderFieldName } from './makeColumnConfigs'

import datasetFullResponse from '../../../test/fixtures/datasetFullResponse.json'
import datasetGroupResponse from '../../../test/fixtures/datasetGroupResponse.json'
import exampleQueryDefinition from '../../../test/fixtures/exampleQueryDefinition.json'

// These example column objects are picked from exampleQueryDefinition

// For regular dataset (NOT GROUP)
const exampleCohortColumnObject = {
  id: 'limiting_session_customer',
  label: 'limiting',
}

const exampleCustomerColumnObject = {
  id: 'customer_table_doctor_email',
  label: 'customer',
}

const exampleConversionColumnObject = {
  id: 'converted_to_ordered_impression_kit',
  label: 'conversion',
}

const exampleComputedColumnObject = {
  id: 'replace_doctor_email',
  label: 'computed',
}

// For GROUP datasets
const groupComputedObject = {
  id: 'replace_organic_raw',
  filters: [],
  label: 'replace_organic_raw',
  name: '',
  output: true,
  source_details: {
    kind: 'freehand_function',
    raw_string: "replace({kind_and_source_limiting_session_session_source}, 'Stuff', 'Organic')",
  },
  source_kind: 'computed',
  type: 'string',
}

const groupMetricObject = {
  _pre_pivot_column_id: null,
  _pre_pivot_column_label: null,
  id: 'metric_total_ordered_impression_kit',
  label: 'total_ordered_impression_kit',
  agg_function: 'SUM',
  output: true,
  column_id: 'converted_to_ordered_impression_kit',
  filters: [],
  pivot: [],
  type: 'number',
}

const groupColumnObject = {
  id: 'kind_and_source_limiting_session_session_kind',
  column_id: 'limiting_session_session_kind',
  filters: [],
  label: 'session_kind',
  output: true,
  type: 'string',
  pivoted: false,
  _isGroupByColumn: true,
}

const groupCacObject = {
  id: '_spend_column_spend',
  filters: [],
  label: 'spend',
  name: 'spend',
  output: true,
  type: 'float',
}

describe('#makeColumnHeaderFieldName', () => {
  it('creates fieldName for cohort column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: exampleCohortColumnObject,
      })
    ).toEqual('_limiting_activities[0]._columns[1]')
  })

  describe('it creates fieldname for customer column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: exampleCustomerColumnObject,
      })
    ).toEqual('_customer_table_columns[2]')
  })

  describe('it creates fieldname for conversion column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: exampleConversionColumnObject,
      })
    ).toEqual('_conversion_activities[0]._columns[1]')
  })

  describe('it creates fieldname for computed column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: exampleComputedColumnObject,
      })
    ).toEqual('_computed_columns[2]')
  })

  describe('it creates fieldname for GROUP By column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: groupColumnObject,
        groupSlug: 'kind_and_source',
      })
    ).toEqual('all_groups[1].columns[1]')
  })

  describe('it creates fieldname for GROUP Metric column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: groupMetricObject,
        groupSlug: 'kind_and_source',
      })
    ).toEqual('all_groups[1].metrics[1]')
  })

  describe('it creates fieldname for GROUP Computed column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: groupComputedObject,
        groupSlug: 'kind_and_source',
      })
    ).toEqual('all_groups[1].computed_columns[1]')
  })

  describe('it creates fieldname for GROUP CAC column', () => {
    expect(
      makeColumnHeaderFieldName({
        queryDefinition: exampleQueryDefinition,
        columnQuery: groupCacObject,
        groupSlug: 'utm_source_group',
      })
    ).toEqual('all_groups[0].spend.columns[0]')
  })
})

describe('#makeColumnConfigs', () => {
  it('creates columnConfigs object for WindowTable', () => {
    expect(
      makeColumnConfigs({
        columnMapping: datasetFullResponse.results.columns_mapping,
        metrics: datasetFullResponse.metrics.columns,
        totalRows: datasetFullResponse.metrics.total_rows,
        queryDefinition: datasetFullResponse.query_definition,
      })
    ).toMatchSnapshot()
  })

  describe('with total_rows > 100,000', () => {
    it('creates columnConfigs object for WindowTable', () => {
      expect(
        makeColumnConfigs({
          columnMapping: datasetFullResponse.results.columns_mapping,
          metrics: datasetFullResponse.metrics.columns,
          totalRows: 990001,
          queryDefinition: datasetFullResponse.query_definition,
        })
      ).toMatchSnapshot()
    })

    describe('with column missing in query definition', () => {
      it('does not create a column config for that column', () => {
        expect(
          makeColumnConfigs({
            columnMapping: [
              {
                id: 'MISSING_COLUMN',
                label: 'MISSING_COLUMN',
              },
              ...datasetFullResponse.results.columns_mapping,
            ],
            metrics: datasetFullResponse.metrics.columns,
            totalRows: datasetFullResponse.metrics.total_rows,
            queryDefinition: datasetFullResponse.query_definition,
          })
        ).toMatchSnapshot()
      })
    })
  })

  describe('when loading metrics', () => {
    it('sets metricsLoading to true', () => {
      expect(
        makeColumnConfigs({
          columnMapping: datasetFullResponse.results.columns_mapping,
          metricsLoading: true,
          queryDefinition: datasetFullResponse.query_definition,
        })
      ).toMatchSnapshot()
    })
  })

  describe('for group by table', () => {
    it('creates columnConfigs object for WindowTable', () => {
      const groupResponse = datasetGroupResponse.groupings.group_by_kind_and_source
      expect(
        makeColumnConfigs({
          columnMapping: groupResponse.results.column_mapping,
          metrics: groupResponse.metrics.columns,
          totalRows: groupResponse.metrics.total_rows,
          groupSlug: 'group_by_kind_and_source',
          queryDefinition: groupResponse.query_definition,
        })
      ).toMatchSnapshot()
    })
  })
})
