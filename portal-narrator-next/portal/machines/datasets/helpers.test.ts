import _ from 'lodash'
import {
  getIftttColumnType,
  handleUpdateComputationColumn,
  makeColumnOptionsWithExistingLabels,
  makeMetricsOnPivotedToggle,
  reverseMetricComputeColumns,
} from './helpers'

import datasetContext from '../../../test/fixtures/dataset/datasetContext.json'
import datasetWithGroupIftttContext from '../../../test/fixtures/dataset/datasetWithGroupIfttt.json'
import datasetGroupResponse from '../../../test/fixtures/datasetGroupResponse.json'

import addComputColumnEventParent from '../../../test/fixtures/datasetMachine/addComputeColumnEventParent.json'
import groupFuncValidationInParentContext from '../../../test/fixtures/datasetMachine/groupFuncValidationInParentContext.json'

import addComputColumnEventWithGroupFuncInGroup from '../../../test/fixtures/datasetMachine/addComputeColumnEventWithGroupFuncInGroup.json'
import groupFuncValidatedInGroupContext from '../../../test/fixtures/datasetMachine/groupFuncValidatedInGroupContext.json'

import {
  DatasetContext,
  DatasetEvent,
  IDatasetQueryColumn,
  IDatasetQueryGroup,
  IDatasetQueryGroupComputedColumn,
} from 'util/datasets/interfaces'

describe('#makeColumnOptionsWithExistingLabels', () => {
  describe('for cohort activity options', () => {
    it('overwrites labels from api with labels from formValue', () => {
      const options = makeColumnOptionsWithExistingLabels({
        options: [
          {
            dropdown_label: '1',
            name: 'ts',
            label: 'Ts',
            type: 'timestamp',
            enrichment_table: null,
            values: [{ key: 'independent_completed_order', value: '43.88%' }],
          },
          {
            dropdown_label: '2',
            name: 'feature_2',
            label: 'Page Path',
            type: 'string',
            enrichment_table: null,
            values: [],
          },
        ],
        formValue: {
          cohort: {
            columns: [{ name: 'ts', label: 'started_session_at', type: 'timestamp', enrichment_table: null }],
          },
        },
      })
      expect(options).toMatchSnapshot()
    })
  })

  describe('for append activity/join options', () => {
    it('overwrites labels from api with labels from formValue', () => {
      const options = makeColumnOptionsWithExistingLabels({
        options: [
          { dropdown_label: '1', name: 'ts', label: 'Ts', type: 'timestamp', enrichment_table: null, values: [] },
          {
            dropdown_label: '2',
            name: 'feature_2',
            label: 'Page Path',
            type: 'string',
            enrichment_table: null,
            values: [],
          },
        ],
        appendActivityIndex: 0,
        formValue: {
          append_activities: [
            {
              columns: [{ name: 'ts', label: 'started_session_at', type: 'timestamp', enrichment_table: null }],
            },
          ],
        },
      })
      expect(options).toMatchSnapshot()
    })
  })
})

const pivotValues = ['first_value', 'second_value,', 'third_value']

describe('#makeMetricsOnPivotedToggle', () => {
  it('creates a metric column for each distinct value', () => {
    const group = datasetGroupResponse.groupings.group_by_kind_and_source.query_definition.query
      .all_groups[0] as unknown as IDatasetQueryGroup

    expect(
      makeMetricsOnPivotedToggle({
        columnId: group.columns[0].id,
        group,
        pivotValues,
      })
    ).toMatchSnapshot()
  })
})

describe('#reverseMetricComputeColumns', () => {
  it('reverses the pivot metrics', () => {
    const groupQuery = datasetGroupResponse.groupings.group_by_kind_and_source.query_definition.query
      .all_groups[0] as unknown as IDatasetQueryGroup

    const { pivotedMetrics, pivotedComputedColumns } = makeMetricsOnPivotedToggle({
      columnId: groupQuery.columns[0].id,
      group: groupQuery,
      pivotValues,
    })

    const updatedGroup = {
      ...groupQuery,
      columns: [{ ...groupQuery.columns[0], pivoted: true }, groupQuery.columns[1]],
      computed_columns: [...groupQuery.computed_columns, ...pivotedComputedColumns],
      metrics: [...groupQuery.metrics, ...pivotedMetrics],
      order: [],
    }

    expect(reverseMetricComputeColumns({ group: updatedGroup })).toMatchSnapshot()
  })
})

describe('#getIftttColumnType', () => {
  // @ts-ignore: datasetContext is directly copied from an example dataset - ignoring for now
  const context = datasetContext as DatasetContext

  it("returns column's 'value_kind' if not 'column_id' or 'null'", () => {
    const stringElseValueColumn = _.find(datasetContext.columns, ['id', 'else_string']) as
      | IDatasetQueryGroupComputedColumn
      | IDatasetQueryColumn
    const type = getIftttColumnType({ column: stringElseValueColumn, context })

    expect(type).toBe('string')
  })

  it("returns column's referenced column_id's value_kind if column's value_kind is 'column_id'", () => {
    const columnWithColumnId = _.find(datasetContext.columns, ['id', 'else_column_id_timestamp']) as
      | IDatasetQueryGroupComputedColumn
      | IDatasetQueryColumn
    const type = getIftttColumnType({ column: columnWithColumnId, context })

    expect(type).toBe('timestamp')
  })

  it("returns first non null case's value_kind if column's value_kind is null", () => {
    const columnWithCase = _.find(datasetContext.columns, ['id', 'broken_null_column__qeXeYQ3y']) as
      | IDatasetQueryGroupComputedColumn
      | IDatasetQueryColumn
    const type = getIftttColumnType({ column: columnWithCase, context })

    expect(type).toBe('number')
  })

  it("returns first non null case's referenced column_ids value_kind if column's value_kind is null and case's value_kind is column_id", () => {
    const columnWithCaseWithColumnId = _.find(datasetContext.columns, ['id', 'broken_null_column']) as
      | IDatasetQueryGroupComputedColumn
      | IDatasetQueryColumn
    const type = getIftttColumnType({ column: columnWithCaseWithColumnId, context })

    expect(type).toBe('string')
  })

  // @ts-ignore: datasetContext is directly copied from an example dataset - ignoring for now
  const withGroupContext = datasetWithGroupIftttContext as DatasetContext

  it('returns a type for a group column', () => {
    // The first group in withGroupContext
    const groupSlug = _.get(withGroupContext, 'all_groups[0].slug')
    // has an ifttt as the first computed column
    const column = _.get(withGroupContext, 'all_groups[0].computed_columns[0]')

    const type = getIftttColumnType({ column: column, context: withGroupContext, groupSlug })
    expect(type).toBe('number')
  })
})

describe('#handleUpdateComputationColumn', () => {
  describe('in a parent tab', () => {
    it('creates a compute column with group_func', () => {
      const computationColumns = handleUpdateComputationColumn({
        context: groupFuncValidationInParentContext as unknown as DatasetContext,
        event: addComputColumnEventParent as DatasetEvent,
      })

      // Check each compute column
      // and ignore "id" since it is always unique
      // https://stackoverflow.com/questions/51619100/using-jest-property-matchers-on-arrays-of-objects
      computationColumns?.forEach((computeColumn) => {
        expect(computeColumn).toMatchSnapshot({
          id: expect.any(String),
        })
      })
    })
  })

  describe('in a group tab', () => {
    it('creates a compute column with group_func', () => {
      const group = handleUpdateComputationColumn({
        context: groupFuncValidatedInGroupContext as unknown as DatasetContext,
        event: addComputColumnEventWithGroupFuncInGroup as DatasetEvent,
      })?.[0] as IDatasetQueryGroup

      // Test group without compute seperately b/c computed columns have unique ids
      const groupWithoutComputeColumns = _.omit(group, 'computed_columns')
      expect(groupWithoutComputeColumns).toMatchSnapshot()

      // check each compute column
      // and ignore "id" since it is always unique
      // https://stackoverflow.com/questions/51619100/using-jest-property-matchers-on-arrays-of-objects
      const computationColumns = group?.computed_columns
      computationColumns?.forEach((computeColumn) => {
        expect(computeColumn).toMatchSnapshot({
          id: expect.any(String),
        })
      })
    })
  })
})
